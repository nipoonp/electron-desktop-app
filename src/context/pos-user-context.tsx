import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";

type TPosUser = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    imageKey: string | null;
    imageIdentityPoolId: string | null;
    posPinEnabled: boolean;
    posPin: string | null;
};

type ContextProps = {
    availableUsers: TPosUser[];
    selectedPosUser: TPosUser | null;
    isUnlocked: boolean;
    isPosPinFeatureEnabled: boolean;
    hasSkippedPosUserSelection: boolean;
    selectPosUser: (posUserId: string) => void;
    skipPosUserSelection: () => void;
    unlockPosUser: (pin: string) => Promise<boolean>;
    lockPosUser: () => void;
    clearSelectedPosUser: () => void;
};

const PosUserContext = createContext<ContextProps>({
    availableUsers: [],
    selectedPosUser: null,
    isUnlocked: false,
    isPosPinFeatureEnabled: false,
    hasSkippedPosUserSelection: false,
    selectPosUser: () => {},
    skipPosUserSelection: () => {},
    unlockPosUser: async () => false,
    lockPosUser: () => {},
    clearSelectedPosUser: () => {},
});

// Saves the selected POS user for the current restaurant and register.
const buildSelectedUserStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserId:${restaurantId || "none"}:${registerId || "none"}`;

// Stores whether the selected POS user has already passed the PIN check for this register.
const buildUnlockedStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserUnlocked:${restaurantId || "none"}:${registerId || "none"}`;

// Marks that the operator intentionally skipped POS user selection because no active staff were available.
const buildSkippedSelectionStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserSkipped:${restaurantId || "none"}:${registerId || "none"}`;

export const PosUserProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const { register, isPOS, isPosPinFeatureEnabled } = useRegister();
    const [selectedPosUser, setSelectedPosUser] = useState<TPosUser | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [hasSkippedPosUserSelection, setHasSkippedPosUserSelection] = useState(false);

    // Builds the active POS user list from restaurant staff links and keeps the data flat for UI usage.
    const availableUsers = useMemo<TPosUser[]>(
        () =>
            !isPOS
                ? []
                : (restaurant?.users?.items || [])
                      // POS users must come from UserRestaurantLink so the selected staff member carries
                      // restaurant-scoped access, permissions, and the CRUD-only POS PIN fields together.
                      .filter((userLink) => !!userLink?.id && !!userLink?.user?.id)
                      .map((userLink) => ({
                          id: userLink.id,
                          userId: userLink.user.id,
                          firstName: userLink.user.firstName,
                          lastName: userLink.user.lastName,
                          email: userLink.user.email,
                          imageKey: userLink.user.image?.key || null,
                          imageIdentityPoolId: userLink.user.image?.identityPoolId || null,
                          posPinEnabled: !!userLink.posPinEnabled,
                          posPin: userLink.posPin || null,
                      }))
                      .sort((left, right) => `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`)),
        [isPOS, restaurant],
    );

    const selectedUserStorageKey = buildSelectedUserStorageKey(restaurant?.id, register?.id);
    const unlockedStorageKey = buildUnlockedStorageKey(restaurant?.id, register?.id);
    const skippedSelectionStorageKey = buildSkippedSelectionStorageKey(restaurant?.id, register?.id);

    // Restores the selected cashier and unlock state whenever restaurant/register context changes.
    useEffect(() => {
        if (!isPOS || !isPosPinFeatureEnabled || !restaurant?.id || !register?.id) {
            setSelectedPosUser(null);
            setIsUnlocked(false);
            setHasSkippedPosUserSelection(false);
            localStorage.removeItem(selectedUserStorageKey);
            localStorage.removeItem(unlockedStorageKey);
            localStorage.removeItem(skippedSelectionStorageKey);
            return;
        }

        const storedSelectedPosUserId = localStorage.getItem(selectedUserStorageKey);
        const matchedUser = availableUsers.find((availableUser) => availableUser.id === storedSelectedPosUserId) || null;
        const canRestoreSkippedSelection = availableUsers.length === 0 && localStorage.getItem(skippedSelectionStorageKey) === "true";

        setSelectedPosUser(matchedUser);
        setIsUnlocked(!!matchedUser && localStorage.getItem(unlockedStorageKey) === "true");
        setHasSkippedPosUserSelection(canRestoreSkippedSelection);

        if (availableUsers.length > 0) {
            localStorage.removeItem(skippedSelectionStorageKey);
        }
    }, [
        availableUsers,
        isPOS,
        isPosPinFeatureEnabled,
        register?.id,
        restaurant?.id,
        selectedUserStorageKey,
        skippedSelectionStorageKey,
        unlockedStorageKey,
    ]);

    // Selects a cashier for the current register and skips PIN only when that user has no PIN enabled.
    const selectPosUser = (posUserId: string) => {
        const matchedUser = availableUsers.find((availableUser) => availableUser.id === posUserId) || null;
        const shouldUnlockWithoutPin = !!matchedUser && !matchedUser.posPinEnabled;

        setSelectedPosUser(matchedUser);
        setIsUnlocked(shouldUnlockWithoutPin);
        setHasSkippedPosUserSelection(false);

        if (matchedUser) {
            localStorage.setItem(selectedUserStorageKey, matchedUser.id);
        } else {
            localStorage.removeItem(selectedUserStorageKey);
        }

        localStorage.removeItem(skippedSelectionStorageKey);

        if (shouldUnlockWithoutPin) {
            localStorage.setItem(unlockedStorageKey, "true");
        } else {
            localStorage.removeItem(unlockedStorageKey);
        }
    };

    // Allows POS flow to continue when the register requires user selection but there are no active users to choose from.
    const skipPosUserSelection = () => {
        setSelectedPosUser(null);
        setIsUnlocked(false);
        setHasSkippedPosUserSelection(true);
        localStorage.removeItem(selectedUserStorageKey);
        localStorage.removeItem(unlockedStorageKey);
        localStorage.setItem(skippedSelectionStorageKey, "true");
    };

    // Verifies the entered PIN for the selected cashier and marks the current register session as unlocked.
    const unlockPosUser = async (pin: string) => {
        if (!selectedPosUser) return false;

        if (!selectedPosUser.posPinEnabled) {
            setIsUnlocked(true);
            localStorage.setItem(unlockedStorageKey, "true");
            return true;
        }

        if (pin.length !== 4 || selectedPosUser.posPin !== pin) return false;

        setIsUnlocked(true);
        localStorage.setItem(unlockedStorageKey, "true");
        return true;
    };

    // Locks the current cashier without clearing who is selected.
    const lockPosUser = () => {
        setIsUnlocked(false);
        localStorage.removeItem(unlockedStorageKey);
    };

    // Clears the cashier selection completely and resets the saved unlock state.
    const clearSelectedPosUser = () => {
        setSelectedPosUser(null);
        setIsUnlocked(false);
        setHasSkippedPosUserSelection(false);
        localStorage.removeItem(selectedUserStorageKey);
        localStorage.removeItem(unlockedStorageKey);
        localStorage.removeItem(skippedSelectionStorageKey);
    };

    return (
        <PosUserContext.Provider
            value={{
                availableUsers,
                selectedPosUser,
                isUnlocked,
                isPosPinFeatureEnabled,
                hasSkippedPosUserSelection,
                selectPosUser,
                skipPosUserSelection,
                unlockPosUser,
                lockPosUser,
                clearSelectedPosUser,
            }}
        >
            {props.children}
        </PosUserContext.Provider>
    );
};

// Reads the current POS cashier state and actions for selection, PIN unlock, and route guards.
export const usePosUser = () => {
    const context = useContext(PosUserContext);
    if (context === undefined) {
        throw new Error(`usePosUser must be used within a PosUserProvider`);
    }
    return context;
};
