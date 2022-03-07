import { useEffect } from "react";
import { useAuth } from "../../../context/auth-context";
import { useRegister } from "../../../context/register-context";
import { useRestaurant } from "../../../context/restaurant-context";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { toast } from "../../../tabin/components/toast";

export default () => {
    const { logout } = useAuth();
    const { register, disconnectRegister } = useRegister();
    const { selectRestaurant } = useRestaurant();

    useEffect(() => {
        (async function token() {
            try {
                if (register) {
                    await disconnectRegister(register.id);
                }

                selectRestaurant(null);
                await logout();
            } catch (err) {
                toast.error(err);
            }
        })();
    }, []);

    return <FullScreenSpinner show={true} text="Logging Out" />;
};
