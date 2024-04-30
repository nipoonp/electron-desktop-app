import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath, tableNumberPath } from "../main";
import { isToday, parse } from 'date-fns';
import { EPaymentMethod, ICartProduct } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useListProductsByRestaurantLazyQuery } from "../../hooks/useListProductsByRestaurantLazyQuery";
import "./paymentMethod.scss";
import { Button } from "../../tabin/components/button";
import { Link } from "../../tabin/components/link";
import { FiX } from "react-icons/fi";
import { ProductSoldOutModal } from "../modals/ProductSoldOutModal";
import { useState } from "react";

const PaymentMethod= () => {
    const navigate = useNavigate();
    const { listProductsByRestaurantByName } = useListProductsByRestaurantLazyQuery();
    const { products,setPaymentMethod,deleteProduct } = useCart();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();
    const [soldOutProduct,setSoldOutProduct]=useState<ICartProduct[]>([]);
    const [inCartProducts,setInCartProducts]=useState<ICartProduct[]>([]);
    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        navigate(`${checkoutPath}`);
    };

    const fetchProducts = async (restaurantId: string, currentNextToken: string | null) => {
        const res = await listProductsByRestaurantByName({
            variables: {
                restaurantId: restaurantId,
                nextToken: currentNextToken,
            },
        });

        const products: ICartProduct[] = res.data.listProductsByRestaurantByName.items;
        const nextToken: string = res.data.listProductsByRestaurantByName.nextToken;

        return { products, nextToken };
    };

    function getMatchingElements(arr, idToMatch) {
        return arr.filter(item => item.id === idToMatch);
    }

    
    const removeSoldOutProduct = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await fetchProducts(restaurant.id, null);
                if (products) {
                    const soldOutProducts:ICartProduct[] = [];
                    const inCartProduct:ICartProduct[] = [];
                    console.log('products',products)
                    for (let i = 0; i < products.length; i++) {
                        const element = products[i];
                        const res_data= getMatchingElements(res.products,element.id)
                        console.log('res_data',res_data)
                        if(res_data[0].soldOutDate && isToday(parse(res_data[0].soldOutDate,'yyyy-MM-dd',new Date()))){
                            soldOutProducts.push(element)
                            deleteProduct(i);
                        }
                        else if (res_data[0].soldOut===false) {
                            inCartProduct.push(element)
                        }
                        else{
                            soldOutProducts.push(element)
                            deleteProduct(i);
                        }
                    }
                    setInCartProducts(inCartProduct);
                    setSoldOutProduct(soldOutProducts);
                    resolve(soldOutProducts);
                } else {
                    reject([]); 
                }
            } catch (error) {
                reject([]); 
            }
        });
    };

    const onSelectPaymentMethod = async(paymentMethod: EPaymentMethod) => {
        try {
            let res : ICartProduct[] | unknown = [];
            if(register?.checkConditionsBeforeCreateOrder){
                res=await removeSoldOutProduct();
            }
            if(Array.isArray(res) && res?.length===0){
                setPaymentMethod(paymentMethod);
                navigate(`${checkoutPath}/true`);
            }
        } catch (error) {
            console.log('Error',error)    
        }
    };

    const onCloseEvent=()=>{
        console.log('inCartProducts',inCartProducts)
        if(inCartProducts.length){
            navigate(`${checkoutPath}/true`);
        }
        else{
            navigate(`${checkoutPath}`);
        }
        setSoldOutProduct([])
    }

    const productSoldOutModal = () => {
        return (
            <>
                {soldOutProduct && soldOutProduct.length ?(
                    <ProductSoldOutModal
                        isOpen={soldOutProduct.length ? true:false}
                        soldOutProduct={soldOutProduct}
                        onClose={()=>onCloseEvent()}
                        onContinue={() => onCloseEvent()}
                    />
                ):null}
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