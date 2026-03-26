import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Minus, Package, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import { useGetAllProducts, useGetCategories } from "../hooks/useQueries";

type CartItem = { product: Product; qty: number };

function formatPrice(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function StorefrontPage({
  navigate,
}: { navigate: (to: string) => void }) {
  const { data: allProducts = [], isLoading } = useGetAllProducts();
  const { data: categories = [] } = useGetCategories();
  const activeProducts = useMemo(
    () => allProducts.filter((p) => p.isActive),
    [allProducts],
  );

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return activeProducts;
    return activeProducts.filter((p) => p.category.name === selectedCategory);
  }, [activeProducts, selectedCategory]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce(
    (s, i) => s + Number(i.product.price) * i.qty,
    0,
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQty = (productId: bigint, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, qty: i.qty + delta } : i,
        )
        .filter((i) => i.qty > 0),
    );
  };

  const removeFromCart = (productId: bigint) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const allCategoryNames = ["All", ...categories.map((c) => c.name)];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-serif text-xl font-semibold tracking-widest uppercase text-foreground"
              data-ocid="nav.link"
            >
              Aura
            </button>
            <nav className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                data-ocid="nav.shop.link"
              >
                Shop
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                data-ocid="nav.admin.link"
              >
                Admin
              </button>
            </nav>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:bg-muted rounded-sm transition-colors"
              data-ocid="cart.open_modal_button"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-body">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="w-full h-[60vh] md:h-[70vh] relative">
            <img
              src="/assets/generated/hero-accessories.dim_1200x600.jpg"
              alt="Aura — Curated Aesthetic Accessories"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="max-w-lg"
                >
                  <p className="text-primary-foreground/70 text-sm uppercase tracking-[0.3em] mb-4 font-body">
                    New Collection
                  </p>
                  <h1 className="font-serif text-4xl md:text-6xl font-semibold text-primary-foreground leading-tight mb-6">
                    Curated with
                    <br />
                    <em>intention.</em>
                  </h1>
                  <p className="text-primary-foreground/80 text-base mb-8 font-body font-light">
                    Aesthetic accessories and clothing for the modern
                    individual.
                  </p>
                  <Button
                    onClick={() =>
                      document
                        .getElementById("shop-section")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-none px-8 py-3 h-auto text-sm uppercase tracking-widest font-body"
                    data-ocid="hero.primary_button"
                  >
                    Shop Now
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Shop section */}
        <section
          id="shop-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          {/* Category filter */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-medium">
              The Collection
            </h2>
            <div className="flex gap-2 flex-wrap justify-end">
              {allCategoryNames.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 text-xs uppercase tracking-widest font-body transition-colors border ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-foreground"
                  }`}
                  data-ocid="products.filter.tab"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              data-ocid="products.loading_state"
            >
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
                <div key={k} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted mb-3" />
                  <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
              data-ocid="products.empty_state"
            >
              <Package className="w-12 h-12 text-muted-foreground mb-6 opacity-40" />
              <h3 className="font-serif text-xl text-muted-foreground mb-2">
                New arrivals coming soon
              </h3>
              <p className="text-muted-foreground text-sm font-body font-light max-w-xs">
                We're carefully curating our next collection. Check back
                shortly.
              </p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10"
              data-ocid="products.list"
            >
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id.toString()}
                    product={product}
                    index={index + 1}
                    onView={() => setSelectedProduct(product)}
                    onAddToCart={() => addToCart(product)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-serif text-lg tracking-widest uppercase">Aura</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="text-muted-foreground text-sm font-body hover:text-foreground transition-colors underline underline-offset-2"
                data-ocid="footer.admin.link"
              >
                Admin Panel
              </button>
              <p className="text-muted-foreground text-sm font-body">
                © {new Date().getFullYear()}. Built with{" "}
                <span className="text-red-400">♥</span> using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <Dialog open onOpenChange={() => setSelectedProduct(null)}>
            <DialogContent
              className="max-w-3xl p-0 overflow-hidden rounded-none border-border"
              data-ocid="product.dialog"
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={selectedProduct.image.getDirectURL()}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="ml-auto flex mb-6 p-1 hover:bg-muted rounded-sm transition-colors"
                      data-ocid="product.close_button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Badge
                      variant="secondary"
                      className="mb-3 rounded-none text-xs uppercase tracking-widest font-body"
                    >
                      {selectedProduct.category.name}
                    </Badge>
                    <h2 className="font-serif text-2xl font-medium mb-3">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
                      {selectedProduct.description}
                    </p>
                    <p className="font-serif text-2xl">
                      {formatPrice(selectedProduct.price)}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      setCartOpen(true);
                    }}
                    className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-xs font-body py-6"
                    data-ocid="product.primary_button"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          className="w-full sm:max-w-md flex flex-col p-0"
          data-ocid="cart.sheet"
        >
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle className="font-serif text-lg font-medium">
              Your Bag ({cartCount})
            </SheetTitle>
          </SheetHeader>
          {cart.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center text-center px-6"
              data-ocid="cart.empty_state"
            >
              <ShoppingBag className="w-10 h-10 text-muted-foreground mb-4 opacity-30" />
              <p className="font-serif text-muted-foreground">
                Your bag is empty
              </p>
              <p className="text-muted-foreground text-sm font-body mt-1">
                Add items to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.map((item, index) => (
                  <div
                    key={item.product.id.toString()}
                    className="flex gap-4"
                    data-ocid={`cart.item.${index + 1}`}
                  >
                    <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
                      <img
                        src={item.product.image.getDirectURL()}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-muted-foreground text-xs font-body mt-0.5">
                        {item.product.category.name}
                      </p>
                      <p className="font-serif text-sm mt-1">
                        {formatPrice(item.product.price)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center border border-border hover:bg-muted rounded-sm"
                          data-ocid={`cart.secondary_button.${index + 1}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-body w-4 text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center border border-border hover:bg-muted rounded-sm"
                          data-ocid={`cart.primary_button.${index + 1}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                          data-ocid={`cart.delete_button.${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground uppercase tracking-widest">
                    Subtotal
                  </span>
                  <span className="font-serif text-xl">
                    ${(cartTotal / 100).toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-xs font-body py-6"
                  onClick={() =>
                    toast.info("Checkout coming soon! Stay tuned.")
                  }
                  data-ocid="cart.submit_button"
                >
                  Checkout
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductCard({
  product,
  index,
  onView,
  onAddToCart,
}: {
  product: Product;
  index: number;
  onView: () => void;
  onAddToCart: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="group"
      data-ocid={`products.item.${index}`}
    >
      {/* Image area - clickable to view, with overlay add-to-cart button */}
      <div className="relative overflow-hidden aspect-[3/4] bg-muted mb-3">
        <button
          type="button"
          className="w-full h-full block"
          onClick={onView}
          aria-label={`View ${product.name}`}
        >
          <img
            src={product.image.getDirectURL()}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          className="absolute bottom-3 left-3 right-3 bg-primary-foreground text-primary text-xs uppercase tracking-widest py-2 font-body opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
          data-ocid={`products.primary_button.${index}`}
        >
          Add to Bag
        </button>
      </div>
      <button type="button" onClick={onView} className="w-full text-left">
        <p className="font-body text-xs text-muted-foreground uppercase tracking-widest mb-1">
          {product.category.name}
        </p>
        <p className="font-serif text-sm font-medium leading-tight mb-1">
          {product.name}
        </p>
        <p className="font-body text-sm text-muted-foreground">
          {formatPrice(product.price)}
        </p>
      </button>
    </motion.div>
  );
}
