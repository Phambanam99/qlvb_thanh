"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Plus, Edit, Trash2, Shield, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { equipmentAPI, EquipmentDTO, EquipmentStatsDTO, LookupItem } from "@/lib/api/equipment";
import { departmentsAPI } from "@/lib/api";
import AuthGuard from "@/components/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { DEPARTMENT_HEAD_ROLES } from "@/lib/role-utils";

export default function EquipmentPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");
  const isDeptHead = !!user?.roles?.some((r) => DEPARTMENT_HEAD_ROLES.includes(r)) || !!user?.isCommanderOfUnit;

  const [items, setItems] = useState<EquipmentDTO[]>([]);
  const [stats, setStats] = useState<EquipmentStatsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentDTO | null>(null);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<Partial<EquipmentDTO>>({ category: "WEAPON", status: "ACTIVE", conditionLabel: "GOOD", quantity: 1 });
  const [lookups, setLookups] = useState<{ categories: LookupItem[]; statuses: LookupItem[]; conditions: LookupItem[] }>({ categories: [], statuses: [], conditions: [] });
  const [filterDeptId, setFilterDeptId] = useState<number | 0>(0);

  // Default department filter to user's department for non-admins
  useEffect(() => {
    if (!isAdmin && user?.departmentId) {
      setFilterDeptId(user.departmentId);
    }
  }, [isAdmin, user?.departmentId]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [page, s, depts, lks] = await Promise.all([
        equipmentAPI.list({ page: 0, size: 100, departmentId: (isAdmin ? (filterDeptId || undefined) : (user?.departmentId || undefined)) }),
        equipmentAPI.stats((isAdmin ? (filterDeptId ? { departmentId: filterDeptId } : {}) : (user?.departmentId ? { departmentId: user.departmentId } : {})) as any),
        departmentsAPI.getAllDepartments(),
        equipmentAPI.lookups(),
      ]);
      setItems(page.content);
      setStats(s);
      const simpleDepts = (depts.data?.content || []).map((d: any) => ({ id: d.id, name: d.name }));
      setDepartments(simpleDepts);
      setLookups(lks);
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể tải dữ liệu trang bị", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filterDeptId, isAdmin, user?.departmentId]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      category: "WEAPON",
      status: "ACTIVE",
      conditionLabel: "GOOD",
      quantity: 1,
      departmentId: isAdmin ? undefined : (user?.departmentId || undefined),
    });
    setIsDialogOpen(true);
  };
  const openEdit = (it: EquipmentDTO) => { setEditing(it); setForm({ ...it }); setIsDialogOpen(true); };
  const closeDialog = () => { setIsDialogOpen(false); setEditing(null); setForm({}); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.name || !form.name.trim()) {
        toast({ title: "Thiếu dữ liệu", description: "Vui lòng nhập tên trang bị", variant: "destructive" });
        return;
      }
      if (!isAdmin) {
        // Force department to user's department for non-admins
        form.departmentId = user?.departmentId;
      }
      if (editing) {
        await equipmentAPI.update(editing.id, form);
        toast({ title: "Thành công", description: "Cập nhật trang bị thành công" });
      } else {
        await equipmentAPI.create(form);
        toast({ title: "Thành công", description: "Tạo trang bị thành công" });
      }
      closeDialog();
      fetchAll();
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message || err?.message || "Không thể lưu trang bị";
      toast({ title: "Lỗi", description: backendMsg, variant: "destructive" });
    }
  };

  const handleDelete = async (it: EquipmentDTO) => {
    if (!confirm(`Xóa trang bị "${it.name}"?`)) return;
    try {
      await equipmentAPI.delete(it.id);
      toast({ title: "Thành công", description: "Đã xóa trang bị" });
      fetchAll();
    } catch {
      toast({ title: "Lỗi", description: "Không thể xóa trang bị", variant: "destructive" });
    }
  };

  const [newCategory, setNewCategory] = useState({ code: "", name: "" });
  const [newStatus, setNewStatus] = useState({ code: "", name: "" });
  const [newCondition, setNewCondition] = useState({ code: "", name: "" });

  const addLookup = async (type: "categories" | "statuses" | "conditions") => {
    try {
      if (type === "categories") {
        if (!newCategory.code.trim() || !newCategory.name.trim()) { toast({ title: "Thiếu dữ liệu", description: "Nhập mã và tên", variant: "destructive" }); return; }
        await equipmentAPI.createCategory({ code: newCategory.code.trim(), name: newCategory.name.trim(), isActive: true } as any);
        setNewCategory({ code: "", name: "" });
      }
      if (type === "statuses") {
        if (!newStatus.code.trim() || !newStatus.name.trim()) { toast({ title: "Thiếu dữ liệu", description: "Nhập mã và tên", variant: "destructive" }); return; }
        await equipmentAPI.createStatus({ code: newStatus.code.trim(), name: newStatus.name.trim(), isActive: true } as any);
        setNewStatus({ code: "", name: "" });
      }
      if (type === "conditions") {
        if (!newCondition.code.trim() || !newCondition.name.trim()) { toast({ title: "Thiếu dữ liệu", description: "Nhập mã và tên", variant: "destructive" }); return; }
        await equipmentAPI.createCondition({ code: newCondition.code.trim(), name: newCondition.name.trim(), isActive: true } as any);
        setNewCondition({ code: "", name: "" });
      }
      await fetchAll();
      toast({ title: "Thành công", description: "Đã thêm" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể thêm", variant: "destructive" });
    }
  };

  const deleteLookup = async (type: "categories" | "statuses" | "conditions", id: number) => {
    if (!confirm("Xóa mục này?")) return;
    try {
      if (type === "categories") await equipmentAPI.deleteCategory(id);
      if (type === "statuses") await equipmentAPI.deleteStatus(id);
      if (type === "conditions") await equipmentAPI.deleteCondition(id);
      await fetchAll();
      toast({ title: "Thành công", description: "Đã xóa" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể xóa", variant: "destructive" });
    }
  };

  const departmentSelectDisabled = !isAdmin;

  return (
    <AuthGuard>
      <div className="container mx-auto max-w-full px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold">Quản lý vũ khí, trang bị</h1>
            </div>
            <p className="text-sm text-muted-foreground">Thêm, sửa, xóa và thống kê vũ khí trang bị theo đơn vị</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            {isAdmin && (
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Thêm trang bị</Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="list" className="mt-6">
          <TabsList>
            <TabsTrigger value="list">Danh sách</TabsTrigger>
            <TabsTrigger value="lookups">Danh mục</TabsTrigger>
          </TabsList>

          <TabsContent value="list">

            {isAdmin && (
              <div className="mt-4 flex items-center gap-3">
                <Label htmlFor="filterDept">Lọc theo đơn vị</Label>
                <select id="filterDept" className="border rounded h-9 px-3" value={filterDeptId} onChange={e => setFilterDeptId(Number(e.target.value))}>
                  <option value={0}>Tất cả đơn vị</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={() => fetchAll()}><Search className="h-4 w-4 mr-1" />Tìm</Button>
              </div>
            )}

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Danh sách trang bị</CardTitle>
                <CardDescription>Quản lý trang bị theo đơn vị</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Đang tải...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Tình trạng</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Chưa có dữ liệu</TableCell></TableRow>
                      ) : items.map(it => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">{it.name}</TableCell>
                          <TableCell>{it.category || "—"}</TableCell>
                          <TableCell>{it.serialNumber || "—"}</TableCell>
                          <TableCell>{it.status || "—"}</TableCell>
                          <TableCell>{it.conditionLabel || "—"}</TableCell>
                          <TableCell>{it.quantity ?? "—"}</TableCell>
                          <TableCell>{it.departmentName || "—"}</TableCell>
                          <TableCell className="text-right">
                            {isAdmin && (
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => openEdit(it)}><Edit className="h-4 w-4 mr-1" />Sửa</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(it)}><Trash2 className="h-4 w-4 mr-1" />Xóa</Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lookups">
            <Tabs defaultValue="categories" className="mt-2">
              <TabsList>
                <TabsTrigger value="categories">Loại trang bị</TabsTrigger>
                <TabsTrigger value="statuses">Trạng thái</TabsTrigger>
                <TabsTrigger value="conditions">Tình trạng</TabsTrigger>
              </TabsList>

              <TabsContent value="categories">
                <Card>
                  <CardHeader>
                    <CardTitle>Loại trang bị</CardTitle>
                    <CardDescription>Quản lý danh mục loại trang bị cho dropdown</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Mã" value={newCategory.code} onChange={e => setNewCategory({ ...newCategory, code: e.target.value })} />
                      <Input placeholder="Tên" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                      <Button onClick={() => addLookup("categories")}><Plus className="h-4 w-4 mr-1" />Thêm</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lookups.categories.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Chưa có</TableCell></TableRow>
                        ) : lookups.categories.map((item: LookupItem) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Hoạt động" : "Tắt"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="destructive" onClick={() => deleteLookup("categories", item.id)}><Trash2 className="h-4 w-4 mr-1" />Xóa</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statuses">
                <Card>
                  <CardHeader>
                    <CardTitle>Trạng thái</CardTitle>
                    <CardDescription>Quản lý danh mục trạng thái trang bị</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Mã" value={newStatus.code} onChange={e => setNewStatus({ ...newStatus, code: e.target.value })} />
                      <Input placeholder="Tên" value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })} />
                      <Button onClick={() => addLookup("statuses")}><Plus className="h-4 w-4 mr-1" />Thêm</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lookups.statuses.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Chưa có</TableCell></TableRow>
                        ) : lookups.statuses.map((item: LookupItem) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Hoạt động" : "Tắt"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="destructive" onClick={() => deleteLookup("statuses", item.id)}><Trash2 className="h-4 w-4 mr-1" />Xóa</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conditions">
                <Card>
                  <CardHeader>
                    <CardTitle>Tình trạng</CardTitle>
                    <CardDescription>Quản lý danh mục tình trạng trang bị</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Mã" value={newCondition.code} onChange={e => setNewCondition({ ...newCondition, code: e.target.value })} />
                      <Input placeholder="Tên" value={newCondition.name} onChange={e => setNewCondition({ ...newCondition, name: e.target.value })} />
                      <Button onClick={() => addLookup("conditions")}><Plus className="h-4 w-4 mr-1" />Thêm</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lookups.conditions.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Chưa có</TableCell></TableRow>
                        ) : lookups.conditions.map((item: LookupItem) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Hoạt động" : "Tắt"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="destructive" onClick={() => deleteLookup("conditions", item.id)}><Trash2 className="h-4 w-4 mr-1" />Xóa</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Chỉnh sửa trang bị" : "Thêm trang bị"}</DialogTitle>
              <DialogDescription>Nhập thông tin trang bị gắn với đơn vị</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên trang bị</Label>
                  <Input id="name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Loại</Label>
                  <select id="category" className="border rounded h-10 px-3" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">— Chọn loại —</option>
                    {lookups.categories.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="serial">Số serial</Label>
                  <Input id="serial" value={form.serialNumber || ""} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <select id="status" className="border rounded h-10 px-3" value={form.status || ""} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="">— Chọn trạng thái —</option>
                    {lookups.statuses.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conditionLabel">Tình trạng</Label>
                  <select id="conditionLabel" className="border rounded h-10 px-3" value={form.conditionLabel || ""} onChange={e => setForm({ ...form, conditionLabel: e.target.value })}>
                    <option value="">— Chọn tình trạng —</option>
                    {lookups.conditions.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Số lượng</Label>
                  <Input id="quantity" type="number" value={form.quantity ?? 0} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Đơn vị</Label>
                  <select id="department" className="border rounded h-10 px-3" value={form.departmentId || 0} onChange={e => setForm({ ...form, departmentId: Number(e.target.value) || undefined })} disabled={departmentSelectDisabled}>
                    <option value={0}>— Chọn đơn vị —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Input id="notes" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Hủy</Button>
                <Button type="submit" disabled={!form.name || !form.name.trim()}>{editing ? "Cập nhật" : "Tạo mới"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
