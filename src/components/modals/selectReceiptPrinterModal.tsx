import { useRegister } from "../../context/register-context";
import { IGET_RESTAURANT_REGISTER_PRINTER } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";

import "./selectReceiptPrinterModal.scss";

interface ISelectReceiptPrinterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPrinter: (printer: IGET_RESTAURANT_REGISTER_PRINTER) => void;
}

export const SelectReceiptPrinterModal = (props: ISelectReceiptPrinterModalProps) => {
    const { register } = useRegister();

    return (
        <>
            <ModalV2 padding="24px" isOpen={props.isOpen} disableClose={false} onRequestClose={props.onClose}>
                <div className="h2 mb-6">Please select a printer</div>
                {register &&
                    register.printers.items.map((printer, index) => (
                        <div key={printer.id}>
                            {index != 0 && <div className="separator-4"></div>}
                            <div className="register-printer-list-item">
                                <div>
                                    <div>{printer.name}</div>
                                    <div className="text-grey mt-2">{printer.address}</div>
                                </div>
                                <Button
                                    onClick={() => {
                                        props.onSelectPrinter(printer);
                                    }}
                                >
                                    Print
                                </Button>
                            </div>
                        </div>
                    ))}
            </ModalV2>
        </>
    );
};
