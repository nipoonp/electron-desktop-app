import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath, tableNumberPath } from "../main";
import { EPaymentMethod, ICartProduct } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";

import "./paymentMethod.scss";
import { Button } from "../../tabin/components/button";
import { Link } from "../../tabin/components/link";
import { FiX } from "react-icons/fi";
import { ProductSoldOutModal } from "../modals/ProductSoldOutModal";
import { useGetProductByIdQuery } from "../../hooks/useGetProductByIdQuery";

const PaymentMethod= () => {
    const navigate = useNavigate();
    const { getProduct } = useGetProductByIdQuery();
    const { products,soldOutProduct,setSoldOutProduct,setPaymentMethod,deleteProduct } = useCart();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();
    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        navigate(`${checkoutPath}`);
    };

    const removeSoldoutProduct = () => {
        return new Promise(async (resolve, reject) => {
            try {
                if (products) {
                    const soldOutProducts:ICartProduct[] = [];
                    for (let i = 0; i < products.length; i++) {
                        const element = products[i];
                        const res = await getProduct({
                            variables: {
                                id: products[i].id
                            },
                        });
    
                        if (res.data.getProduct.soldOut) {
                            deleteProduct(i);
                            soldOutProducts.push(element)
                        }
                    }
                    console.log('soldOutProducts',soldOutProducts)
                    setSoldOutProduct(soldOutProducts);
                    resolve(true);
                } else {
                    reject(new Error('Products array is undefined or empty')); 
                }
            } catch (error) {
                reject(error); 
            }
        });
    };

    const onSelectPaymentMethod = async(paymentMethod: EPaymentMethod) => {
        try {
            await removeSoldoutProduct()
            if(soldOutProduct && soldOutProduct?.length==0){
                setPaymentMethod(paymentMethod);
                navigate(`${checkoutPath}/true`);
            }
        } catch (error) {
            console.log('Error',error)    
        }
    };

    const onCloseEvent=()=>{
        setSoldOutProduct([])
    
        navigate(`${checkoutPath}/true`);
    }

    const productSoldOutModal = () => {
        return (
            <>
                {soldOutProduct && soldOutProduct.length && (
                    <ProductSoldOutModal
                        isOpen={soldOutProduct.length ? true:false}
                        soldOutProduct={soldOutProduct}
                        onClose={()=>onCloseEvent()}
                        onContinue={() => onCloseEvent()}
                    />
                )}
            </>
        );
    };

    return (
        <>
            <PageWrapper>
                <div className="payment-method">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClose} />
                    </div>
                    <div className="h1 mb-12 select-your-payment-method">Select your payment method</div>
                    <div className="payment-method-payment-button-wrapper">
                        {register.enableCashPayments && (
                            <Button className="large payment-method-cash-button" onClick={() => onSelectPaymentMethod(EPaymentMethod.CASH)}>
                                Cash
                            </Button>
                        )}
                        {register.enableEftposPayments && (
                            <Button className="large payment-method-eftpos-button ml-2" onClick={() => onSelectPaymentMethod(EPaymentMethod.EFTPOS)}>
                                Eftpos
                            </Button>
                        )}
                    </div>
                    {register.enablePayLater && (
                        <Link className="payment-method-pay-later mt-8" onClick={() => onSelectPaymentMethod(EPaymentMethod.LATER)}>
                            I'm not sure, I will pay later at the counter...
                        </Link>
                    )}
                </div>
                {productSoldOutModal()}
            </PageWrapper>
        </>
    );
};

export default PaymentMethod;