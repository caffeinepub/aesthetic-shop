import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, type Product } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateProduct,
  useDeleteProduct,
  useEditProduct,
  useGetAllProducts,
  useIsCallerAdmin,
} from "../hooks/useQueries";

type ProductFormData = {
  name: string;
  description: string;
  categoryName: string;
  price: string;
  imageFile: File | null;
  isActive: boolean;
  existingImage?: ExternalBlob;
  id?: bigint;
};

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  categoryName: "",
  price: "",
  imageFile: null,
  isActive: true,
};

export default function AdminPage({
  navigate,
}: { navigate: (to: string) => void }) {
  const { identity, login, loginStatus, clear } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products = [], isLoading: productsLoading } =
    useGetAllProducts();

  const createProduct = useCreateProduct();
  const editProduct = useEditProduct();
  const deleteProduct = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin token claim state
  const [adminToken, setAdminToken] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimAdmin = async () => {
    if (!adminToken.trim() || !actor) return;
    setIsClaiming(true);
    try {
      await (actor as any)._initializeAccessControlWithSecret(
        adminToken.trim(),
      );
      await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    } catch {
      toast.error("Invalid token. Please check and try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      categoryName: product.category.name,
      price: (Number(product.price) / 100).toFixed(2),
      imageFile: null,
      isActive: product.isActive,
      existingImage: product.image,
      id: product.id,
    });
    setEditingId(product.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.categoryName) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const priceInCents = BigInt(
      Math.round(Number.parseFloat(formData.price) * 100),
    );
    setIsSubmitting(true);
    try {
      let imageBlob: ExternalBlob;
      if (formData.imageFile) {
        const bytes = new Uint8Array(await formData.imageFile.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
          setUploadProgress(p),
        );
      } else if (formData.existingImage) {
        imageBlob = formData.existingImage;
      } else {
        toast.error("Please upload a product image.");
        setIsSubmitting(false);
        return;
      }

      if (editingId !== null) {
        await editProduct.mutateAsync({
          id: editingId,
          name: formData.name,
          description: formData.description,
          category: { name: formData.categoryName },
          price: priceInCents,
          image: imageBlob,
          isActive: formData.isActive,
        });
        toast.success("Product updated!");
      } else {
        await createProduct.mutateAsync({
          name: formData.name,
          description: formData.description,
          categoryName: formData.categoryName,
          price: priceInCents,
          image: imageBlob,
        });
        toast.success("Product created!");
      }
      setFormOpen(false);
      setUploadProgress(0);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-body"
                data-ocid="admin.nav.link"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Shop
              </button>
              <span className="text-muted-foreground">|</span>
              <span className="font-serif text-lg">Admin Panel</span>
            </div>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground font-body"
                data-ocid="admin.secondary_button"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          >
            <h2 className="font-serif text-3xl mb-3">Admin Access</h2>
            <p className="text-muted-foreground font-body mb-8 max-w-sm">
              Sign in to manage your products and collections.
            </p>
            <Button
              onClick={() => login()}
              disabled={loginStatus === "logging-in"}
              className="rounded-none px-10 py-3 h-auto uppercase tracking-widest text-xs font-body"
              data-ocid="admin.primary_button"
            >
              {loginStatus === "logging-in" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.div>
        ) : adminLoading ? (
          <div
            className="flex items-center justify-center min-h-[50vh]"
            data-ocid="admin.loading_state"
          >
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
            data-ocid="admin.panel"
          >
            <KeyRound className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
            <h2 className="font-serif text-2xl mb-2">Enter Admin Token</h2>
            <p className="text-muted-foreground font-body text-sm mb-8 max-w-sm">
              Enter your admin token to claim admin access. This was provided
              when you set up your shop.
            </p>
            <div className="w-full max-w-sm space-y-3">
              <Input
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClaimAdmin()}
                placeholder="Admin token"
                className="rounded-none font-body text-center tracking-widest"
                data-ocid="admin.token.input"
              />
              <Button
                onClick={handleClaimAdmin}
                disabled={isClaiming || !adminToken.trim()}
                className="w-full rounded-none px-10 py-3 h-auto uppercase tracking-widest text-xs font-body"
                data-ocid="admin.submit_button"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Claim Admin Access"
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl">Products</h2>
              <Button
                onClick={openAdd}
                className="rounded-none uppercase tracking-widest text-xs font-body h-auto py-2.5 px-5"
                data-ocid="admin.open_modal_button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div
                className="flex items-center justify-center py-20"
                data-ocid="products.loading_state"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div
                className="text-center py-20 text-muted-foreground"
                data-ocid="products.empty_state"
              >
                <p className="font-serif text-lg mb-2">No products yet</p>
                <p className="text-sm font-body">
                  Add your first product to get started.
                </p>
              </div>
            ) : (
              <div className="border border-border" data-ocid="products.table">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-body text-xs uppercase tracking-widest w-16">
                        Image
                      </TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-widest">
                        Name
                      </TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-widest">
                        Category
                      </TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-widest">
                        Price
                      </TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-widest">
                        Status
                      </TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-widest text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow
                        key={product.id.toString()}
                        data-ocid={`products.row.${index + 1}`}
                      >
                        <TableCell>
                          <div className="w-12 h-12 bg-muted overflow-hidden">
                            <img
                              src={product.image.getDirectURL()}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-sm font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {product.category.name}
                        </TableCell>
                        <TableCell className="font-serif text-sm">
                          ${(Number(product.price) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-body text-xs uppercase tracking-widest px-2 py-0.5 ${
                              product.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {product.isActive ? "Active" : "Hidden"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(product)}
                              className="h-8 w-8"
                              data-ocid={`products.edit_button.${index + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(product.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              data-ocid={`products.delete_button.${index + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent
          className="max-w-lg rounded-none"
          data-ocid="product.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-medium">
              {editingId ? "Edit Product" : "New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-body text-xs uppercase tracking-widest">
                Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Silk Hair Scarf"
                className="rounded-none font-body"
                data-ocid="product.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-xs uppercase tracking-widest">
                Description
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe the product..."
                className="rounded-none font-body resize-none"
                rows={3}
                data-ocid="product.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase tracking-widest">
                  Category *
                </Label>
                <Input
                  value={formData.categoryName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, categoryName: e.target.value }))
                  }
                  placeholder="e.g. Accessories"
                  className="rounded-none font-body"
                  data-ocid="product.category.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase tracking-widest">
                  Price (USD) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="0.00"
                  className="rounded-none font-body"
                  data-ocid="product.price.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-xs uppercase tracking-widest">
                Image
              </Label>
              {formData.existingImage && !formData.imageFile && (
                <div className="w-20 h-20 bg-muted overflow-hidden mb-2">
                  <img
                    src={formData.existingImage.getDirectURL()}
                    alt="current"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    imageFile: e.target.files?.[0] ?? null,
                  }))
                }
                className="rounded-none font-body cursor-pointer"
                data-ocid="product.upload_button"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
            {editingId && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) =>
                    setFormData((p) => ({ ...p, isActive: v }))
                  }
                  data-ocid="product.active.switch"
                />
                <Label className="font-body text-sm">
                  Product visible in shop
                </Label>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="flex-1 rounded-none font-body uppercase tracking-widest text-xs"
              data-ocid="product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-none font-body uppercase tracking-widest text-xs"
              data-ocid="product.submit_button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadProgress > 0
                    ? `Uploading ${uploadProgress}%`
                    : "Saving..."}
                </>
              ) : editingId ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-none" data-ocid="delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">
              Delete Product?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This action cannot be undone. The product will be permanently
              removed from your shop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-none font-body uppercase tracking-widest text-xs"
              data-ocid="delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-none font-body uppercase tracking-widest text-xs bg-destructive hover:bg-destructive/90"
              data-ocid="delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
