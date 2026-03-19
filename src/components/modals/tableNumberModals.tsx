import { useState } from "react";
import { FiEye, FiEyeOff, FiTrash2, FiPlus } from "react-icons/fi";
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
            overlayClassName="table-layout-modal-overlay"
        >
            <div className="table-layout-edit-modal">
                <div className="h3 mb-2">Edit Floor Plan</div>
                <div className="mb-3">
                    You are about to edit the table layout for <strong>{props.sectionName}</strong>.
                </div>
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
    onAddSection: (name: string) => string | null;
    onSave: () => void;
    onDeleteSection: (sectionId: string) => void;
    onSectionNameChange: (sectionId: string, value: string) => void;
    onSectionVisibilityChange: (sectionId: string, isVisible: boolean) => void;
}

export const TableSectionSettingsModal = (props: ITableSectionSettingsModalProps) => {
    const [addingSection, setAddingSection] = useState(false);
    const [newName, setNewName] = useState("");
    const [addError, setAddError] = useState<string | null>(null);

    const handleAddClick = () => {
        setNewName("");
        setAddError(null);
        setAddingSection(true);
    };

    const handleAddConfirm = () => {
        const error = props.onAddSection(newName);
        if (error) {
            setAddError(error);
            return;
        }
        setAddingSection(false);
        setNewName("");
        setAddError(null);
    };

    const handleAddCancel = () => {
        setAddingSection(false);
        setNewName("");
        setAddError(null);
    };

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
                            <button
                                type="button"
                                className="section-icon-btn"
                                onClick={() => props.onSectionVisibilityChange(section.id, !!section.hidden)}
                                title={section.hidden ? "Show section" : "Hide section"}
                            >
                                {section.hidden ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                            <button
                                type="button"
                                className="section-icon-btn danger"
                                onClick={() => props.onDeleteSection(section.id)}
                                disabled={props.sectionDrafts.length <= 1}
                                title={props.sectionDrafts.length <= 1 ? "At least one section is required." : `Delete ${section.name}`}
                            >
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {addingSection ? (
                        <div className="section-add-inline">
                            <input
                                className="section-input"
                                value={newName}
                                onChange={(e) => {
                                    setNewName(e.target.value);
                                    if (addError) setAddError(null);
                                }}
                                placeholder="Section name"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddConfirm();
                                    if (e.key === "Escape") handleAddCancel();
                                }}
                            />
                            <button type="button" className="section-icon-btn" onClick={handleAddConfirm} title="Confirm">
                                <FiPlus size={16} />
                            </button>
                        </div>
                    ) : (
                        <button type="button" className="add-section-row" onClick={handleAddClick}>
                            <FiPlus size={14} />
                            <span>Add Section</span>
                        </button>
                    )}
                    {addError && <div className="section-error">{addError}</div>}
                </div>
                <div className="modal-actions">
                    <Button onClick={props.onSave}>Save</Button>
                </div>
            </div>
        </ModalV2>
    );
};
