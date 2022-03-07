import { add, addDays, format } from "date-fns";
import moment from "moment";
import Papa, { UnparseObject } from "papaparse";
import { useEffect, useState } from "react";
import Clock from "react-clock";
import { useNavigate } from "react-router";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { IBestHour, IDayComparisonExport, useSalesAnalytics } from "../../context/salesAnalytics-context";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { EOrderStatus, IGET_RESTAURANT_REGISTER_PRINTER } from "../../graphql/customQueries";
import { EReceiptPrinterType } from "../../model/model";
import { getTwelveHourFormat } from "../../model/util";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Card } from "../../tabin/components/card";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { toast } from "../../tabin/components/toast";
import { convertCentsToDollars, downloadFile, getDollarString } from "../../util/util";
import { salesAnalyticsDailySalesPath, salesAnalyticsHourlySalesPath, salesAnalyticsTopCategoryPath, salesAnalyticsTopProductPath } from "../main";
import { SelectReceiptPrinterModal } from "../modals/selectReceiptPrinterModal";
import { LineGraph } from "./salesAnalytics/salesAnalyticsGraphs";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

import "react-clock/dist/Clock.css";
import "./salesAnalytics.scss";

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { refetchRestaurantOrdersByBetweenPlacedAt, startDate, endDate, salesAnalytics, error, loading } = useSalesAnalytics();
    const { printSalesData } = useReceiptPrinter();
    const [showSelectReceiptPrinterModal, setShowSelectReceiptPrinterModal] = useState(false);
    const [receiptPrinterModalType, setReceiptPrinterModalType] = useState<"DAY" | "CATEGORY" | "PRODUCT">("DAY");

    const graphColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");

    useEffect(() => {
        refetchRestaurantOrdersByBetweenPlacedAt();
    }, []);

    const BestHourCard = (props: { bestHour: IBestHour }) => {
        const { bestHour } = props;

        return (
            <div className="card" style={{ textAlign: "center" }}>
                <div className="text-uppercase">Best Hour</div>
                <div className="besthour-clock-wrapper m-2">
                    <Clock
                        className="besthour-clock"
                        value={add(new Date().setHours(0, 0, 0, 0), { hours: Number(bestHour.hour) })}
                        renderSecondHand={false}
                        renderMinuteMarks={false}
                    />
                </div>
                <div className="h4">{getTwelveHourFormat(Number(bestHour.hour))}</div>
                <div>
                    <span className="h4">{`$${convertCentsToDollars(bestHour.totalAmount)}`}</span> total sales
                </div>
                <div>
                    <span className="h4">{bestHour.totalQuantity}</span> order(s)
                </div>
            </div>
        );
    };

    const onClickDailySales = () => {
        navigate(salesAnalyticsDailySalesPath);
    };

    const onClickHourlySales = () => {
        navigate(salesAnalyticsHourlySalesPath);
    };

    const onClickTopCategory = () => {
        navigate(salesAnalyticsTopCategoryPath);
    };

    const onClickTopProduct = () => {
        navigate(salesAnalyticsTopProductPath);
    };

    const onExportDailySales = () => {
        if (salesAnalytics) {
            downloadCSVFile(salesAnalytics.dailySalesExport, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Day`);
        }
    };

    const onPrintData = async (type: "DAY" | "CATEGORY" | "PRODUCT") => {
        setReceiptPrinterModalType(type);

        if (salesAnalytics && register) {
            if (register.printers.items.length > 1) {
                setShowSelectReceiptPrinterModal(true);
            } else if (register.printers.items.length === 1) {
                await printDailySalesData(type, register.printers.items[0].type, register.printers.items[0].address);
            } else {
                toast.error("No receipt printers configured");
            }
        }
    };

    const onExportHourlySales = () => {
        if (salesAnalytics) {
            downloadCSVFile(
                salesAnalytics.hourlySalesExport,
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Hour`
            );
        }
    };

    const onExportMostSoldCategory = () => {
        if (salesAnalytics) {
            downloadCSVFile(
                salesAnalytics.mostSoldCategoriesExport,
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Category`
            );
        }
    };

    const onExportMostSoldProduct = () => {
        if (salesAnalytics) {
            downloadCSVFile(
                salesAnalytics.mostSoldProductsExport,
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Product`
            );
        }
    };

    const onExportAll = () => {
        if (salesAnalytics) {
            downloadCSVFile(
                calculateDailySalesExport(),
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_Comparison_By_Day`
            );
            downloadCSVFile(
                calculateHourlySalesExport(),
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_Comparison_By_Hour`
            );
            downloadCSVFile(
                calculateCategorySalesExport(),
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_Comparison_By_Category`
            );
            downloadCSVFile(
                calculateProductSalesExport(),
                `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_Comparison_By_Product`
            );
        }
    };

    const calculateDailySalesExport = () => {
        // CSV Date Comparison Export
        const dailySalesExport = {} as UnparseObject<Array<string | number>>;

        if (salesAnalytics) {
            dailySalesExport.fields = ["Date", ...salesAnalytics.exportSalesDates];
            dailySalesExport.data = [];
            dailySalesExport.data.push(["Orders"], ["Cash"], ["Eftpos"], ["Online"], ["Tax"], ["Total"]);

            salesAnalytics.dailySalesExport.data.forEach((d) => {
                dailySalesExport.data[0] = [...dailySalesExport.data[0], d[1]];
                dailySalesExport.data[1] = [...dailySalesExport.data[1], d[2]];
                dailySalesExport.data[2] = [...dailySalesExport.data[2], d[3]];
                dailySalesExport.data[3] = [...dailySalesExport.data[3], d[4]];
                dailySalesExport.data[4] = [...dailySalesExport.data[4], d[5]];
                dailySalesExport.data[5] = [...dailySalesExport.data[5], d[6]];
            });
        }

        return dailySalesExport;
    };

    const calculateHourlySalesExport = () => {
        const hourlySalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics && startDate) {
            hourlySalesExport.fields = ["Time", ...salesAnalytics.exportSalesDates];
            hourlySalesExport.data = [];

            const hourlySales: IDayComparisonExport = {};

            for (let i = 0; i < salesAnalytics.daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);

                hourlySales[format(new Date(loopDateTime), "yyyy-MM-dd")] = {
                    "00": { name: "00", total: 0 },
                    "01": { name: "01", total: 0 },
                    "02": { name: "02", total: 0 },
                    "03": { name: "03", total: 0 },
                    "04": { name: "04", total: 0 },
                    "05": { name: "05", total: 0 },
                    "06": { name: "06", total: 0 },
                    "07": { name: "07", total: 0 },
                    "08": { name: "08", total: 0 },
                    "09": { name: "09", total: 0 },
                    "10": { name: "10", total: 0 },
                    "11": { name: "11", total: 0 },
                    "12": { name: "12", total: 0 },
                    "13": { name: "13", total: 0 },
                    "14": { name: "14", total: 0 },
                    "15": { name: "15", total: 0 },
                    "16": { name: "16", total: 0 },
                    "17": { name: "17", total: 0 },
                    "18": { name: "18", total: 0 },
                    "19": { name: "19", total: 0 },
                    "20": { name: "20", total: 0 },
                    "21": { name: "21", total: 0 },
                    "22": { name: "22", total: 0 },
                    "23": { name: "23", total: 0 },
                };
            }

            salesAnalytics.orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
                const placedAtHour: string = format(new Date(order.placedAt), "HH");

                if (order.status === EOrderStatus.NEW || order.status === EOrderStatus.COMPLETED) {
                    hourlySales[placedAt][placedAtHour] = {
                        name: placedAtHour,
                        total: hourlySales[placedAt][placedAtHour].total + order.total,
                    };
                }
            });

            Object.entries(hourlySales).forEach(([date, obj]) => {
                const hourKeys = Object.keys(obj).sort((a, b) => a[0].localeCompare(b[0]));

                hourKeys.forEach((hour, index) => {
                    if (!hourlySalesExport.data[index] || hourlySalesExport.data[index].length === 0) {
                        hourlySalesExport.data.push([getTwelveHourFormat(Number(hour))]);
                    }
                    hourlySalesExport.data[index] = [...hourlySalesExport.data[index], getDollarString(obj[hour].total)];
                });
            });
        }
        return hourlySalesExport;
    };

    const calculateCategorySalesExport = () => {
        const categorySalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics && startDate && restaurant) {
            categorySalesExport.fields = ["Category", ...salesAnalytics.exportSalesDates];
            categorySalesExport.data = [];

            const categorySales: IDayComparisonExport = {};
            const categories = [...restaurant.categories.items].sort((a, b) => (a.name > b.name && 1) || -1);

            for (let i = 0; i < salesAnalytics.daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);
                const defaultCategorySale = {};

                categories.forEach((c) => (defaultCategorySale[c.id] = { name: c.name, total: 0 }));
                categorySales[format(new Date(loopDateTime), "yyyy-MM-dd")] = defaultCategorySale;
            }

            salesAnalytics.orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");

                order.products &&
                    order.products.forEach((product) => {
                        if (!product.category) return;
                        let newTotalAmount = categorySales[placedAt][product.category.id].total + product.price * product.quantity;

                        product.modifierGroups &&
                            product.modifierGroups.forEach((modifierGroup) => {
                                modifierGroup.modifiers.forEach((modifier) => {
                                    newTotalAmount += product.quantity * modifier.price * modifier.quantity;
                                });
                            });

                        categorySales[placedAt][product.category.id] = {
                            name: categorySales[placedAt][product.category.id].name,
                            total: newTotalAmount,
                        };
                    });
            });

            Object.entries(categorySales).forEach(([date, obj]) => {
                Object.entries(obj).forEach(([id, category], index) => {
                    if (!categorySalesExport.data[index] || categorySalesExport.data[index].length === 0) {
                        categorySalesExport.data.push([category.name]);
                    }
                    categorySalesExport.data[index] = [...categorySalesExport.data[index], getDollarString(category.total)];
                });
            });
        }
        return categorySalesExport;
    };

    const calculateProductSalesExport = () => {
        const productSalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics && startDate && restaurant) {
            productSalesExport.fields = ["Product", ...salesAnalytics.exportSalesDates];
            productSalesExport.data = [];

            const productSales: IDayComparisonExport = {};
            const products = [...restaurant.products.items].sort((a, b) => (a.name > b.name && 1) || -1);

            for (let i = 0; i < salesAnalytics.daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);
                const defaultProductSale = {};

                products.forEach((p) => (defaultProductSale[p.id] = { name: p.name, total: 0 }));
                productSales[format(new Date(loopDateTime), "yyyy-MM-dd")] = defaultProductSale;
            }

            salesAnalytics.orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");

                order.products &&
                    order.products.forEach((product) => {
                        let newTotalAmount = productSales[placedAt][product.id].total + product.price * product.quantity;

                        product.modifierGroups &&
                            product.modifierGroups.forEach((modifierGroup) => {
                                modifierGroup.modifiers.forEach((modifier) => {
                                    newTotalAmount += product.quantity * modifier.price * modifier.quantity;
                                });
                            });

                        productSales[placedAt][product.id] = {
                            name: productSales[placedAt][product.id].name,
                            total: newTotalAmount,
                        };
                    });
            });

            Object.entries(productSales).forEach(([date, obj]) => {
                Object.entries(obj).forEach(([id, product], index) => {
                    if (!productSalesExport.data[index] || productSalesExport.data[index].length === 0) {
                        productSalesExport.data.push([product.name]);
                    }
                    productSalesExport.data[index] = [...productSalesExport.data[index], getDollarString(product.total)];
                });
            });
        }
        return productSalesExport;
    };

    const downloadCSVFile = (data: UnparseObject<Array<string | number>>, fileName: string) => {
        const csv = Papa.unparse(data);
        var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadFile(csvData, fileName, ".csv");
    };

    const printDailySalesData = async (type: "DAY" | "CATEGORY" | "PRODUCT", printerType: EReceiptPrinterType, address: string) => {
        if (!salesAnalytics) return;

        await printSalesData({
            printerType: printerType,
            printerAddress: address,
            type: type,
            startDate: startDate || "",
            endDate: endDate || "",
            dailySales: salesAnalytics.dailySales,
            mostSoldCategories: salesAnalytics.mostSoldCategories,
            mostSoldProducts: salesAnalytics.mostSoldProducts,
        });
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={"Loading sales analytics..."} />;
    }

    const onCloseSelectReceiptPrinterModal = () => {
        setShowSelectReceiptPrinterModal(false);
    };

    const onSelectPrinter = async (printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
        await printDailySalesData(receiptPrinterModalType, printer.type, printer.address);
    };

    const selectReceiptPrinterModal = () => {
        return (
            <>
                {showSelectReceiptPrinterModal && (
                    <SelectReceiptPrinterModal
                        isOpen={showSelectReceiptPrinterModal}
                        onClose={onCloseSelectReceiptPrinterModal}
                        onSelectPrinter={onSelectPrinter}
                    />
                )}
            </>
        );
    };

    const modalsAndSpinners = <>{selectReceiptPrinterModal()}</>;

    return (
        <>
            <SalesAnalyticsWrapper title="Sales Analytics" onExportAll={onExportAll}>
                {!startDate || !endDate ? (
                    <div className="text-center">Please select a start and end date.</div>
                ) : salesAnalytics && salesAnalytics.totalSoldItems > 0 ? (
                    <div className="sales-analytics-grid">
                        <div className="sales-analytics-grid-item1">
                            <Card title="Sales By Day" onOpen={onClickDailySales} onExport={onExportDailySales} onPrint={() => onPrintData("DAY")}>
                                <div style={{ width: "100%", height: "300px" }}>
                                    <LineGraph xAxis="date" lines={["sales"]} graphData={salesAnalytics.dayByGraphData} fill={graphColor} />
                                </div>
                            </Card>
                        </div>
                        <div className="sales-analytics-grid-item2 analytics-value-wrapper">
                            <Card className="text-center">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(salesAnalytics.totalSubTotal)}`}</div>
                                <div className="text-uppercase">Total Sales</div>
                            </Card>
                            <Card className="text-center">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(
                                    isNaN(salesAnalytics.totalSubTotal / salesAnalytics.orders.length)
                                        ? 0
                                        : salesAnalytics.totalSubTotal / salesAnalytics.orders.length
                                )}`}</div>
                                <div className="text-uppercase">Average Sales</div>
                            </Card>
                            <Card className="text-center">
                                <div className="h3 mb-1">{salesAnalytics.orders.length}</div>
                                <div className="text-uppercase">Sales Count</div>
                            </Card>
                            <Card className="text-center">
                                <div className="h3 mb-1">{salesAnalytics.totalSoldItems}</div>
                                <div className="text-uppercase">Items Sold</div>
                            </Card>
                        </div>
                        <div className="sales-analytics-grid-item3">
                            <Card title="Sales By Hour" onOpen={onClickHourlySales} onExport={onExportHourlySales}>
                                <div style={{ width: "100%", height: "250px" }}>
                                    <LineGraph xAxis="hour" lines={["sales"]} graphData={salesAnalytics.hourByGraphData} fill={graphColor} />
                                </div>
                            </Card>
                        </div>
                        {salesAnalytics.bestHour && (
                            <div className="sales-analytics-grid-item4">
                                <BestHourCard bestHour={salesAnalytics.bestHour} />
                            </div>
                        )}
                        {salesAnalytics.topSoldCategory && (
                            <div className="sales-analytics-grid-item5">
                                <Card
                                    title="Top Category"
                                    onOpen={onClickTopCategory}
                                    onExport={onExportMostSoldCategory}
                                    onPrint={() => onPrintData("CATEGORY")}
                                >
                                    <div className="top-item-container" style={{ alignItems: "center" }}>
                                        <div className="top-item-image text-center">
                                            {salesAnalytics.topSoldCategory.item?.image && (
                                                <CachedImage
                                                    url={`${getCloudFrontDomainName()}/protected/${
                                                        salesAnalytics.topSoldCategory.item.image.identityPoolId
                                                    }/${salesAnalytics.topSoldCategory.item.image.key}`}
                                                    className="image mb-2"
                                                    alt={salesAnalytics.topSoldCategory.item.name}
                                                />
                                            )}
                                            <div>{salesAnalytics.topSoldCategory?.item?.name}</div>
                                        </div>
                                        <div className="top-item-details text-center">
                                            <div className="text-uppercase">Quantity</div>
                                            <div className="h4 mb-2">{salesAnalytics.topSoldCategory.totalQuantity}</div>
                                            <div className="text-uppercase">Sale Amount</div>
                                            <div className="h4 mb-2">${convertCentsToDollars(salesAnalytics.topSoldCategory.totalAmount ?? 0)}</div>
                                            <div className="text-uppercase">% of Sales</div>
                                            <div className="h4">
                                                {salesAnalytics.totalSubTotal
                                                    ? ((salesAnalytics.topSoldCategory.totalAmount / salesAnalytics.totalSubTotal) * 100).toFixed(2)
                                                    : 0}
                                                %
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                        {salesAnalytics.topSoldProduct && (
                            <div className="sales-analytics-grid-item6">
                                <Card
                                    title="Top Product"
                                    onOpen={onClickTopProduct}
                                    onExport={onExportMostSoldProduct}
                                    onPrint={() => onPrintData("PRODUCT")}
                                >
                                    <div className="top-item-container" style={{ alignItems: "center" }}>
                                        <div className="top-item-image text-center">
                                            {salesAnalytics.topSoldProduct.item?.image && (
                                                <CachedImage
                                                    url={`${getCloudFrontDomainName()}/protected/${
                                                        salesAnalytics.topSoldProduct.item.image.identityPoolId
                                                    }/${salesAnalytics.topSoldProduct.item.image.key}`}
                                                    className="image mb-2"
                                                    alt={salesAnalytics.topSoldProduct.item.name}
                                                />
                                            )}
                                            <div>{salesAnalytics.topSoldProduct?.item?.name}</div>
                                        </div>
                                        <div className="top-item-details text-center">
                                            <div className="text-uppercase">Quantity</div>
                                            <div className="h4 mb-2">{salesAnalytics.topSoldProduct.totalQuantity}</div>
                                            <div className="text-uppercase">Sale Amount</div>
                                            <div className="h4 mb-2">${convertCentsToDollars(salesAnalytics.topSoldProduct.totalAmount ?? 0)}</div>
                                            <div className="text-uppercase">% of Sales</div>
                                            <div className="h4">
                                                {salesAnalytics.totalSubTotal
                                                    ? ((salesAnalytics.topSoldProduct.totalAmount / salesAnalytics.totalSubTotal) * 100).toFixed(2)
                                                    : 0}
                                                %
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">No orders were placed during this period. Please select another date range.</div>
                )}
            </SalesAnalyticsWrapper>
            {modalsAndSpinners}
        </>
    );
};
