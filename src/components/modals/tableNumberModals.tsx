import { ISection } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";

import "./tableNumberModals.scss";

interface ITableLayoutEditModalProps {
    isOpen: boolean;
    sectionName?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const TableLayoutEditModal = (props: ITableLayoutEditModalProps) => {
    return (
        <ModalV2
            isOpen={props.isOpen}
            onRequestClose={props.onClose}
            disableClose={false}
            width="400px"
            padding="0"
            overlayClassName="table-layout-modal-overlay"
        >
            <div className="table-layout-edit-modal">
                <div className="h3 mb-3">Edit Floor Plan</div>
                <p>
                    You are about to edit the table layout for <strong>{props.sectionName}</strong>.
                </p>
                <div className="modal-actions">
                    <Button onClick={props.onConfirm}>Confirm & Edit</Button>
                </div>
            </div>
        </ModalV2>
    );
};

interface ITableSectionSettingsModalProps {
    isOpen: boolean;
    sectionDrafts: ISection[];
    sectionError: string | null;
    onClose: () => void;
    onAddSection: () => void;
    onSave: () => void;
    onDeleteSection: (sectionId: string) => void;
    onSectionNameChange: (sectionId: string, value: string) => void;
    onSectionVisibilityChange: (sectionId: string, isVisible: boolean) => void;
}

export const TableSectionSettingsModal = (props: ITableSectionSettingsModalProps) => {
    return (
        <ModalV2
            isOpen={props.isOpen}
            onRequestClose={props.onClose}
            disableClose={false}
            width="460px"
            padding="0"
            overlayClassName="table-layout-modal-overlay"
        >
            <div className="table-section-settings-modal">
                <div className="h3">Section Settings</div>
                <p>Rename sections, or toggle visibility for the floor plan.</p>
                {props.sectionError && <div className="section-error">{props.sectionError}</div>}
                <div className="section-list">
                    {props.sectionDrafts.map((section) => (
                        <div key={section.id} className="section-row">
                            <input
                                className="section-input"
                                value={section.name}
                                onChange={(e) => props.onSectionNameChange(section.id, e.target.value)}
                            />
                            <label className="section-toggle">
                                <input
                                    type="checkbox"
                                    checked={!section.hidden}
                                    onChange={(e) => props.onSectionVisibilityChange(section.id, e.target.checked)}
                                />
                                <span>{section.hidden ? "Hidden" : "Visible"}</span>
                            </label>
                            <button
                                type="button"
                                className="section-delete"
                                onClick={() => props.onDeleteSection(section.id)}
                                disabled={props.sectionDrafts.length <= 1}
                                title={props.sectionDrafts.length <= 1 ? "At least one section is required." : `Delete ${section.name}`}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
                <div className="modal-actions">
                    <Button onClick={props.onAddSection}>Add Section</Button>
                    <Button onClick={props.onSave}>Save</Button>
                </div>
            </div>
        </ModalV2>
    );
};

interface ITableAddSectionModalProps {
    isOpen: boolean;
    value: string;
    error: string | null;
    onClose: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
}

export const TableAddSectionModal = (props: ITableAddSectionModalProps) => {
    return (
        <ModalV2
            isOpen={props.isOpen}
            onRequestClose={props.onClose}
            disableClose={false}
            width="360px"
            padding="0"
            overlayClassName="table-layout-modal-overlay"
        >
            <div className="table-add-section-modal">
                <h3>Add Section</h3>
                <p>Enter a name for the new section.</p>
                {props.error && <div className="section-error">{props.error}</div>}
                <input
                    className="section-input"
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                    placeholder="Section name"
                    autoFocus
                />
                <div className="modal-actions">
                    <Button onClick={props.onSave}>Add Section</Button>
                </div>
            </div>
        </ModalV2>
    );
};
