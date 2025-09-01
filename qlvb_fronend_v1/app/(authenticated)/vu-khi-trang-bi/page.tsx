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
import { equipmentInventoryAPI, WeaponInventoryRow, AmmunitionInventoryRow, VehicleInventoryRow } from "@/lib/api/equipment-inventory";

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

  // Sidebar state & data for inventory sections
  const [section, setSection] = useState<"weapons" | "ammo" | "vehicles" | "engineering" | "power">("weapons");
  const [query, setQuery] = useState("");
  const [weaponRows, setWeaponRows] = useState<WeaponInventoryRow[]>([]);
  const [ammoRows, setAmmoRows] = useState<AmmunitionInventoryRow[]>([]);
  const [vehicleRows, setVehicleRows] = useState<VehicleInventoryRow[]>([]);
  const [engineeringRows, setEngineeringRows] = useState<VehicleInventoryRow[]>([]);
  const [powerRows, setPowerRows] = useState<any[]>([]);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editSection, setEditSection] = useState<typeof section>("weapons");
  const [editRecord, setEditRecord] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (section === "weapons") setWeaponRows(await equipmentInventoryAPI.getWeapons(query));
      if (section === "ammo") setAmmoRows(await equipmentInventoryAPI.getAmmunitions(query));
      if (section === "vehicles") setVehicleRows(await equipmentInventoryAPI.getVehicles(query));
      if (section === "engineering") setEngineeringRows(await equipmentInventoryAPI.getEngineeringVehicles(query));
      if (section === "power") setPowerRows(await equipmentInventoryAPI.getPowerStations(query));
    };
    load();
  }, [section, query]);

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

        {/* Inventory with left sidebar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Danh mục</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant={section === "weapons" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSection("weapons")}>Súng</Button>
              <Button variant={section === "ammo" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSection("ammo")}>Đạn dược</Button>
              <Button variant={section === "vehicles" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSection("vehicles")}>Ô tô</Button>
              <Button variant={section === "engineering" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSection("engineering")}>Xe máy công binh</Button>
              <Button variant={section === "power" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSection("power")}>Tạm nguồn điện</Button>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder={section === "weapons" ? "Tìm theo tên/ nước sản xuất/ phân cấp/ đơn vị" : section === "ammo" ? "Tìm theo tên đạn/ phân cấp/ đơn vị" : section === "vehicles" ? "Tìm theo số đăng ký/ biên chế/ chất lượng/ trạng thái" : section === "engineering" ? "Tìm theo số đăng ký/ biên chế/ đơn vị/ phân cấp/ chất lượng/ trạng thái sd" : "Tìm theo tên trạm nguồn/ số đăng ký trạm/ cấp chất lượng/ mục đích sd/ trạng thái sd/ đơn vị"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-xl"
              />
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>Xóa</Button>
            </div>

            {section === "weapons" && (
              <Card>
                <CardHeader>
                  <CardTitle>Súng</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2} className="w-[48px] text-center align-middle">TT</TableHead>
                        <TableHead rowSpan={2}>Tên súng pháo, khí tài</TableHead>
                        <TableHead rowSpan={2}>Nước sản xuất</TableHead>
                        <TableHead rowSpan={2}>ĐVT</TableHead>
                        <TableHead rowSpan={2}>Phân cấp</TableHead>
                        <TableHead rowSpan={2}>Số lượng</TableHead>
                        <TableHead colSpan={6} className="text-center">Thực lực ở các đơn vị</TableHead>
                        <TableHead rowSpan={2}>Ghi chú</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead>Cộng</TableHead>
                        <TableHead>TM</TableHead>
                        <TableHead>D1</TableHead>
                        <TableHead>D2</TableHead>
                        <TableHead>D3</TableHead>
                        <TableHead>Kho lữ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weaponRows.map((r, idx) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.origin || ""}</TableCell>
                          <TableCell>{r.unit}</TableCell>
                          <TableCell>{r.grade || ""}</TableCell>
                          <TableCell className="text-center">{r.quantity}</TableCell>
                          <TableCell className="text-center">{r.distribution.total}</TableCell>
                          <TableCell className="text-center">{r.distribution.tm}</TableCell>
                          <TableCell className="text-center">{r.distribution.d1}</TableCell>
                          <TableCell className="text-center">{r.distribution.d2}</TableCell>
                          <TableCell className="text-center">{r.distribution.d3}</TableCell>
                          <TableCell className="text-center">{r.distribution.khoLu}</TableCell>
                          <TableCell className="flex justify-between items-center">
                            <span>{r.note || ""}</span>
                            {isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => { setEditSection("weapons"); setEditRecord(r); setEditOpen(true); }}>Sửa</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {section === "ammo" && (
              <Card>
                <CardHeader>
                  <CardTitle>Đạn dược</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2} className="w-[48px] text-center align-middle">TT</TableHead>
                        <TableHead rowSpan={2}>Tên đạn dược</TableHead>
                        <TableHead rowSpan={2}>Đơn vị tính</TableHead>
                        <TableHead rowSpan={2}>Phân cấp</TableHead>
                        <TableHead rowSpan={2}>Số lượng</TableHead>
                        <TableHead rowSpan={2}>Khối lượng (tấn)</TableHead>
                        <TableHead colSpan={6} className="text-center">Số lượng phân bổ ở các đơn vị</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead>TM</TableHead>
                        <TableHead>d1</TableHead>
                        <TableHead>d2</TableHead>
                        <TableHead>d3</TableHead>
                        <TableHead>Kho lữ</TableHead>
                        <TableHead>Kho K820</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ammoRows.map((r, idx) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.unit}</TableCell>
                          <TableCell>{r.grade || ""}</TableCell>
                          <TableCell className="text-right">{r.quantity}</TableCell>
                          <TableCell className="text-right">{r.weightTon?.toLocaleString(undefined, { minimumFractionDigits: 3 }) || "0"}</TableCell>
                          <TableCell className="text-right">{r.distribution.tm}</TableCell>
                          <TableCell className="text-right">{r.distribution.d1}</TableCell>
                          <TableCell className="text-right">{r.distribution.d2}</TableCell>
                          <TableCell className="text-right">{r.distribution.d3}</TableCell>
                          <TableCell className="text-right">{r.distribution.khoLu}</TableCell>
                          <TableCell className="text-right">{r.distribution.khoK820 ?? 0}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => { setEditSection("ammo"); setEditRecord(r); setEditOpen(true); }}>Sửa</Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {section === "vehicles" && (
              <Card>
                <CardHeader>
                  <CardTitle>Ô tô</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[48px] text-center">TT</TableHead>
                        <TableHead>Số đăng ký</TableHead>
                        <TableHead>Nhãn xe cơ sở</TableHead>
                        <TableHead>Số khung</TableHead>
                        <TableHead>Số máy</TableHead>
                        <TableHead>Năm s.xuất</TableHead>
                        <TableHead>Năm b.s. dụng</TableHead>
                        <TableHead>Nguồn gốc</TableHead>
                        <TableHead>B.chế ở (e,f,lữ,.)</TableHead>
                        <TableHead>Phân cấp CL</TableHead>
                        <TableHead>Trạng thái SD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleRows.map((v, idx) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{v.registration}</TableCell>
                          <TableCell>{v.makeModel}</TableCell>
                          <TableCell>{v.chassisNo || ""}</TableCell>
                          <TableCell>{v.engineNo || ""}</TableCell>
                          <TableCell>{v.manufactureYear || ""}</TableCell>
                          <TableCell>{v.startUseYear || ""}</TableCell>
                          <TableCell>{v.origin || ""}</TableCell>
                          <TableCell>{v.stationedAt || ""}</TableCell>
                          <TableCell>{v.qualityGrade || ""}</TableCell>
                          <TableCell className="flex justify-between items-center">
                            <span>{v.status || ""}</span>
                            {isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => { setEditSection("vehicles"); setEditRecord(v); setEditOpen(true); }}>Sửa</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {section === "engineering" && (
              <Card>
                <CardHeader>
                  <CardTitle>Xe máy công binh</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[48px] text-center">TT</TableHead>
                        <TableHead>Số đăng ký</TableHead>
                        <TableHead>Nhãn xe cơ sở</TableHead>
                        <TableHead>Số khung</TableHead>
                        <TableHead>Số máy</TableHead>
                        <TableHead>Năm s.xuất</TableHead>
                        <TableHead>Năm b.s. dụng</TableHead>
                        <TableHead>Nguồn gốc</TableHead>
                        <TableHead>B.chế ở (e,f,lữ,.)</TableHead>
                        <TableHead>Phân cấp CL</TableHead>
                        <TableHead>Trạng thái SD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engineeringRows.map((v, idx) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{v.registration}</TableCell>
                          <TableCell>{v.makeModel}</TableCell>
                          <TableCell>{v.chassisNo || ""}</TableCell>
                          <TableCell>{v.engineNo || ""}</TableCell>
                          <TableCell>{v.manufactureYear || ""}</TableCell>
                          <TableCell>{v.startUseYear || ""}</TableCell>
                          <TableCell>{v.origin || ""}</TableCell>
                          <TableCell>{v.stationedAt || ""}</TableCell>
                          <TableCell>{v.qualityGrade || ""}</TableCell>
                          <TableCell className="flex justify-between items-center">
                            <span>{v.status || ""}</span>
                            {isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => { setEditSection("engineering"); setEditRecord(v); setEditOpen(true); }}>Sửa</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {section === "power" && (
              <Card>
                <CardHeader>
                  <CardTitle>Tạm nguồn điện</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[48px] text-center">TT</TableHead>
                        <TableHead>Tên trạm nguồn</TableHead>
                        <TableHead>Nhiên liệu SD</TableHead>
                        <TableHead>Số hiệu trạm</TableHead>
                        <TableHead>Năm sản xuất</TableHead>
                        <TableHead>Năm BĐ SD</TableHead>
                        <TableHead>Cấp CL</TableHead>
                        <TableHead>M/đích SD</TableHead>
                        <TableHead>T/thái SD</TableHead>
                        <TableHead>Đơn vị</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {powerRows.map((p: any, idx: number) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.fuel}</TableCell>
                          <TableCell>{p.stationCode || ""}</TableCell>
                          <TableCell>{p.manufactureYear || ""}</TableCell>
                          <TableCell>{p.startUseYear || ""}</TableCell>
                          <TableCell>{p.qualityLevel ?? ""}</TableCell>
                          <TableCell>{p.purpose || ""}</TableCell>
                          <TableCell>{p.status || ""}</TableCell>
                          <TableCell className="flex justify-between items-center">
                            <span>{p.unitName || ""}</span>
                            {isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => { setEditSection("power"); setEditRecord(p); setEditOpen(true); }}>Sửa</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={(o) => setEditOpen(o)}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Chỉnh sửa</DialogTitle>
                  <DialogDescription>Cập nhật thông tin theo mục</DialogDescription>
                </DialogHeader>
                {editRecord && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editSection === "weapons" && (
                      <>
                        <div className="grid gap-2"><Label>Tên</Label><Input value={editRecord.name || ""} onChange={(e) => setEditRecord({ ...editRecord, name: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Nước sản xuất</Label><Input value={editRecord.origin || ""} onChange={(e) => setEditRecord({ ...editRecord, origin: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>ĐVT</Label><Input value={editRecord.unit || ""} onChange={(e) => setEditRecord({ ...editRecord, unit: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Phân cấp</Label><Input value={editRecord.grade || ""} onChange={(e) => setEditRecord({ ...editRecord, grade: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Số lượng</Label><Input type="number" value={editRecord.quantity || 0} onChange={(e) => setEditRecord({ ...editRecord, quantity: Number(e.target.value) })} /></div>
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-6 gap-3 p-3 rounded border">
                          <div className="grid gap-1"><Label>Cộng</Label><Input type="number" value={editRecord.distribution?.total || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, total: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>TM</Label><Input type="number" value={editRecord.distribution?.tm || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, tm: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>D1</Label><Input type="number" value={editRecord.distribution?.d1 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, d1: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>D2</Label><Input type="number" value={editRecord.distribution?.d2 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, d2: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>D3</Label><Input type="number" value={editRecord.distribution?.d3 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, d3: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>Kho lữ</Label><Input type="number" value={editRecord.distribution?.khoLu || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, khoLu: Number(e.target.value) } })} /></div>
                        </div>
                        <div className="grid gap-2 md:col-span-2"><Label>Ghi chú</Label><Input value={editRecord.note || ""} onChange={(e) => setEditRecord({ ...editRecord, note: e.target.value })} /></div>
                      </>
                    )}
                    {editSection === "ammo" && (
                      <>
                        <div className="grid gap-2"><Label>Tên đạn</Label><Input value={editRecord.name || ""} onChange={(e) => setEditRecord({ ...editRecord, name: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Đơn vị tính</Label><Input value={editRecord.unit || ""} onChange={(e) => setEditRecord({ ...editRecord, unit: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Phân cấp</Label><Input value={editRecord.grade || ""} onChange={(e) => setEditRecord({ ...editRecord, grade: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Số lượng</Label><Input type="number" value={editRecord.quantity || 0} onChange={(e) => setEditRecord({ ...editRecord, quantity: Number(e.target.value) })} /></div>
                        <div className="grid gap-2"><Label>Khối lượng (tấn)</Label><Input type="number" step="0.001" value={editRecord.weightTon || 0} onChange={(e) => setEditRecord({ ...editRecord, weightTon: Number(e.target.value) })} /></div>
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-6 gap-3 p-3 rounded border">
                          <div className="grid gap-1"><Label>TM</Label><Input type="number" value={editRecord.distribution?.tm || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, tm: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>d1</Label><Input type="number" value={editRecord.distribution?.d1 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, d1: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>d2</Label><Input type="number" value={editRecord.distribution?.d2 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, d2: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>d3</Label><Input type="number" value={editRecord.distribution?.d3 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, d3: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>Kho lữ</Label><Input type="number" value={editRecord.distribution?.khoLu || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, khoLu: Number(e.target.value) } })} /></div>
                          <div className="grid gap-1"><Label>Kho K820</Label><Input type="number" value={editRecord.distribution?.khoK820 || 0} onChange={(e) => setEditRecord({ ...editRecord, distribution: { ...editRecord.distribution, khoK820: Number(e.target.value) } })} /></div>
                        </div>
                      </>
                    )}
                    {(editSection === "vehicles" || editSection === "engineering") && (
                      <>
                        <div className="grid gap-2"><Label>Số đăng ký</Label><Input value={editRecord.registration || ""} onChange={(e) => setEditRecord({ ...editRecord, registration: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Nhãn xe cơ sở</Label><Input value={editRecord.makeModel || ""} onChange={(e) => setEditRecord({ ...editRecord, makeModel: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Số khung</Label><Input value={editRecord.chassisNo || ""} onChange={(e) => setEditRecord({ ...editRecord, chassisNo: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Số máy</Label><Input value={editRecord.engineNo || ""} onChange={(e) => setEditRecord({ ...editRecord, engineNo: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Năm s.xuất</Label><Input type="number" value={editRecord.manufactureYear || 0} onChange={(e) => setEditRecord({ ...editRecord, manufactureYear: Number(e.target.value) })} /></div>
                        <div className="grid gap-2"><Label>Năm b.s. dụng</Label><Input type="number" value={editRecord.startUseYear || 0} onChange={(e) => setEditRecord({ ...editRecord, startUseYear: Number(e.target.value) })} /></div>
                        <div className="grid gap-2"><Label>Nguồn gốc</Label><Input value={editRecord.origin || ""} onChange={(e) => setEditRecord({ ...editRecord, origin: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>B.chế ở</Label><Input value={editRecord.stationedAt || ""} onChange={(e) => setEditRecord({ ...editRecord, stationedAt: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Phân cấp CL</Label><Input value={editRecord.qualityGrade || ""} onChange={(e) => setEditRecord({ ...editRecord, qualityGrade: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Trạng thái SD</Label><Input value={editRecord.status || ""} onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })} /></div>
                      </>
                    )}
                    {editSection === "power" && (
                      <>
                        <div className="grid gap-2"><Label>Tên trạm nguồn</Label><Input value={editRecord.name || ""} onChange={(e) => setEditRecord({ ...editRecord, name: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Nhiên liệu SD</Label><Input value={editRecord.fuel || ""} onChange={(e) => setEditRecord({ ...editRecord, fuel: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Số hiệu trạm</Label><Input value={editRecord.stationCode || ""} onChange={(e) => setEditRecord({ ...editRecord, stationCode: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Năm sản xuất</Label><Input type="number" value={editRecord.manufactureYear || 0} onChange={(e) => setEditRecord({ ...editRecord, manufactureYear: Number(e.target.value) })} /></div>
                        <div className="grid gap-2"><Label>Năm BĐ SD</Label><Input type="number" value={editRecord.startUseYear || 0} onChange={(e) => setEditRecord({ ...editRecord, startUseYear: Number(e.target.value) })} /></div>
                        <div className="grid gap-2"><Label>Cấp CL</Label><Input value={editRecord.qualityLevel || ""} onChange={(e) => setEditRecord({ ...editRecord, qualityLevel: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>M/đích SD</Label><Input value={editRecord.purpose || ""} onChange={(e) => setEditRecord({ ...editRecord, purpose: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>T/thái SD</Label><Input value={editRecord.status || ""} onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Đơn vị</Label><Input value={editRecord.unitName || ""} onChange={(e) => setEditRecord({ ...editRecord, unitName: e.target.value })} /></div>
                      </>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
                  <Button onClick={async () => {
                    if (!editRecord) return;
                    if (editSection === "weapons") await equipmentInventoryAPI.updateWeapon(editRecord);
                    if (editSection === "ammo") await equipmentInventoryAPI.updateAmmunition(editRecord);
                    if (editSection === "vehicles") await equipmentInventoryAPI.updateVehicle(editRecord);
                    if (editSection === "engineering") await equipmentInventoryAPI.updateEngineeringVehicle(editRecord);
                    if (editSection === "power") await equipmentInventoryAPI.updatePowerStation(editRecord);
                    setEditOpen(false);
                    // Refresh current list
                    if (section === "weapons") setWeaponRows(await equipmentInventoryAPI.getWeapons(query));
                    if (section === "ammo") setAmmoRows(await equipmentInventoryAPI.getAmmunitions(query));
                    if (section === "vehicles") setVehicleRows(await equipmentInventoryAPI.getVehicles(query));
                    if (section === "engineering") setEngineeringRows(await equipmentInventoryAPI.getEngineeringVehicles(query));
                    if (section === "power") setPowerRows(await equipmentInventoryAPI.getPowerStations(query));
                  }}>Lưu</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Legacy tabs (kept hidden for now) */}
        <Tabs defaultValue="list" className="mt-6 hidden">
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
