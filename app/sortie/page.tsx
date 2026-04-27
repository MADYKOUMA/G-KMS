"use client";
import { OrderItem, Product } from "@/type";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { deductStockWithTransaction, readProducts } from "../components/actions";
import Wrapper from "../components/Wrapper";
import ProductComponent from "../components/ProductComponent";
import EmptyState from "../components/EmptyState";
import ProductImage from "../components/ProductImage";
import { Trash } from "lucide-react";
import { toast } from "react-toastify";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNo: string;
    createdAt: Date;
    items: OrderItem[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProductIds, setSelectproductIds] = useState<string[]>([]);

  const formatAmount = (value: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

  const fetchProducts = async () => {
    try {
      if (email) {
        const products = await readProducts(email);
        if (products) {
          setProducts(products);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (email) fetchProducts();
  }, [email]);

  const filteredAvailableProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((product) => !selectedProductIds?.includes(product.id))
    .slice(0, 10);

  const handleAddToCart = (product: Product) => {
    setOrder((prevOrder) => {
      const existingProduct = prevOrder.find(
        (item) => item.productId === product.id,
      );
      let updatedOrder;
      if (existingProduct) {
        updatedOrder = prevOrder.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.quantity),
              }
            : item,
        );
      } else {
        updatedOrder = [
          ...prevOrder,
          {
            productId: product.id,
            quantity: 1,
            unit: product.unit,
            imageUrl: product.imageUrl,
            name: product.name,
            availableQuantity: product.quantity,
            price: product.price,
            purchasePrice: product.purchasePrice ?? 0,
          },
        ];
      }
      setSelectproductIds((prevSelected) =>
        prevSelected.includes(product.id)
          ? prevSelected
          : [...prevSelected, product.id],
      );
      return updatedOrder;
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setOrder((prevOrder) => {
      const updatedOrder = prevOrder.filter(
        (item) => item.productId !== productId,
      );
      setSelectproductIds((prevSelectedProductIds) =>
        prevSelectedProductIds.filter((id) => id !== productId),
      );
      return updatedOrder;
    });
  };

  const handlePrintReceipt = () => {
    if (!lastReceipt) return;

    const total = lastReceipt.items.reduce((acc, item) => {
      const unitPrice = item.price ?? 0;
      return acc + unitPrice * item.quantity;
    }, 0);

    const rowsHtml = lastReceipt.items
      .map((item) => {
        const unitPrice = item.price ?? 0;
        const lineTotal = unitPrice * item.quantity;
        return `
          <tr>
            <td style="padding:6px 0;">${item.name}</td>
            <td style="padding:6px 0; text-align:right; white-space:nowrap;">${item.quantity} ${item.unit}</td>
            <td style="padding:6px 0; text-align:right; white-space:nowrap;">${formatAmount(unitPrice)} CFA</td>
            <td style="padding:6px 0; text-align:right; white-space:nowrap;">${formatAmount(lineTotal)} CFA</td>
          </tr>
        `;
      })
      .join("");

    const win = window.open("", "_blank", "width=420,height=720");
    if (!win) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression (popup bloquée).");
      return;
    }

    win.document.open();
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reçu ${lastReceipt.receiptNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #111; }
            .header { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; }
            h1 { font-size: 18px; margin: 0; }
            .meta { font-size: 12px; color: #444; margin-top: 6px; }
            hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
            table { width:100%; border-collapse: collapse; font-size: 12px; }
            th { text-align:left; font-size: 12px; color: #444; border-bottom: 1px solid #ddd; padding: 6px 0; }
            .total { display:flex; justify-content:space-between; font-weight:700; margin-top: 10px; }
            .footer { margin-top: 14px; font-size: 12px; color: #444; text-align:center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Reçu</h1>
              <div class="meta">N°: ${lastReceipt.receiptNo}</div>
              <div class="meta">Date: ${new Date(lastReceipt.createdAt).toLocaleString("fr-FR")}</div>
            </div>
          </div>
          <hr />
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th style="text-align:right;">Qté</th>
                <th style="text-align:right;">PU</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <hr />
          <div class="total">
            <div>Total</div>
            <div>${formatAmount(total)} CFA</div>
          </div>
          <div class="footer">Merci pour votre achat</div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleSubmit = async () =>{
    try {
        if(order.length == 0){
            toast.error("Veuillez ajouter des produits à la commande")
            return
        }
        const response = await deductStockWithTransaction(order, email)
        if(response.success){
            const receipt = {
              receiptNo: response.receiptNo ?? "0000",
              createdAt: new Date(),
              items: order.map((i) => ({ ...i })),
            };
            toast.success("Commande confirmée avec succès")
            setLastReceipt(receipt);
            setTimeout(() => {
              (
                document.getElementById("receipt_modal") as HTMLDialogElement | null
              )?.showModal?.();
            }, 0);
            setOrder([])
            setSelectproductIds([])
            fetchProducts()
        }else{
            toast.error(`${response.message}`)
        }
    } catch (error) {
        console.error(error)
    }
  }

  return (
    <Wrapper>
      <div className="flex md:flex-row flex-col-reverse">
        <div className="md:w-1/3">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="input input-bordered w-full mb-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="space-y-4">
            {filteredAvailableProducts.length > 0 ? (
              filteredAvailableProducts.map((product, index) => (
                <ProductComponent
                  key={index}
                  add={true}
                  product={product}
                  handleAddToCard={handleAddToCart}
                />
              ))
            ) : (
              <EmptyState
                message="Aucun produit disponible"
                IconComponent="PackageSearch"
              />
            )}
          </div>
        </div>
        <div className="md:w-2/3 p-4 md:ml-4 mb-4 md:mb-0 h-fit border-2 border-base-200 rouded-3xl overflow-x-auto">
          {order.length > 0 ? (
            <div>
              <table className="table w-full scroll-auto">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Nom</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>PU</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {order.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <ProductImage
                          src={item.imageUrl}
                          alt={item.imageUrl}
                          heightClass="h-12"
                          widthClass="w-12"
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>
                        <input
                          type="number"
                          className="input input-bordered w-20"
                          value={item.quantity}
                          min="1"
                          max={item.availableQuantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.productId,
                              Number(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="capitalize">{item.unit}</td>
                      <td className="whitespace-nowrap">
                        {formatAmount(item.price ?? 0)} CFA
                      </td>
                      <td className="whitespace-nowrap font-semibold">
                        {formatAmount((item.price ?? 0) * item.quantity)} CFA
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => handleRemoveFromCart(item.productId)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4 gap-3 flex-wrap">
                <div className="font-bold">
                  Total:{" "}
                  {formatAmount(
                    order.reduce(
                      (acc, item) => acc + (item.price ?? 0) * item.quantity,
                      0,
                    ),
                  )}{" "}
                  CFA
                </div>
              <button
                className="btn btn-primary mt-4 w-fit"
                onClick={handleSubmit}
              >
                Confimer la commande
              </button>
              </div>
            </div>
          ) : (
            <EmptyState
              message="Aucun produit dans le panier"
              IconComponent="HandHeart"
            />
          )}
        </div>
      </div>

      <dialog id="receipt_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Reçu</h3>
          {lastReceipt ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/70">N°</span>
                <span className="font-semibold">{lastReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Date</span>
                <span className="font-semibold">
                  {new Date(lastReceipt.createdAt).toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="divider my-2" />
              <div className="max-h-56 overflow-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th className="text-right">Qté</th>
                      <th className="text-right">PU</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastReceipt.items.map((it) => (
                      <tr key={it.productId}>
                        <td className="max-w-[220px] truncate">{it.name}</td>
                        <td className="text-right whitespace-nowrap">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {formatAmount(it.price ?? 0)} CFA
                        </td>
                        <td className="text-right whitespace-nowrap font-semibold">
                          {formatAmount((it.price ?? 0) * it.quantity)} CFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divider my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>
                  {formatAmount(
                    lastReceipt.items.reduce(
                      (acc, it) => acc + (it.price ?? 0) * it.quantity,
                      0,
                    ),
                  )}{" "}
                  CFA
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-base-content/70">
              Aucun reçu disponible.
            </div>
          )}

          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintReceipt}
                disabled={!lastReceipt}
              >
                Imprimer
              </button>
              <button className="btn">Fermer</button>
            </form>
          </div>
        </div>
      </dialog>
    </Wrapper>
  );
};

export default page;
