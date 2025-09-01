"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PersonnelStrengthTable, { PersonnelRowInput } from "@/components/personnel/personnel-strength-table";
import { personnelAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function PersonnelStrengthPage() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Sample units aligned with the image. Replace with API data later.
  const initialRows: PersonnelRowInput[] = useMemo(
    () => [
      { id: 1, unitName: "CH Lữ đoàn" },
      { id: 2, unitName: "Phòng Tham mưu" },
      { id: 3, unitName: "Phòng Chính trị" },
      { id: 4, unitName: "Phòng HC-KT" },
      { id: 5, unitName: "Tiểu đoàn 1" },
      { id: 6, unitName: "Tiểu đoàn 2" },
      { id: 7, unitName: "Tiểu đoàn 3" },
    ],
    []
  );

  const [rows, setRows] = useState<PersonnelRowInput[]>(initialRows);
  const { hasRole } = useAuth();
  const canEdit = hasRole("ROLE_ADMIN");

  // Load mock data for selected date
  useEffect(() => {
    const load = async () => {
      const res = await personnelAPI.getDaily(date);
      const mapped: PersonnelRowInput[] = res.data.rows.map((r) => ({
        id: r.id,
        unitName: r.unitName,
        siQuan: r.siQuan,
        qncn: r.qncn,
        hsqBs: r.hsqBs,
        phepTT: r.phepTT,
        vien: r.vien,
        hocXa: r.hocXa,
        cheDo: r.cheDo,
        congTacXa: r.congTacXa,
        doMin: r.doMin,
        benhXa: r.benhXa,
        note: r.note,
      }));
      setRows(mapped);
    };
    load();
  }, [date]);

  const handleRowsChange = async (next: PersonnelRowInput[]) => {
    setRows(next);
    if (canEdit) {
      await personnelAPI.saveDaily({
        date,
        rows: next.map((r) => ({
          id: r.id,
          unitName: r.unitName,
          siQuan: r.siQuan || 0,
          qncn: r.qncn || 0,
          hsqBs: r.hsqBs || 0,
          phepTT: r.phepTT || 0,
          vien: r.vien || 0,
          hocXa: r.hocXa || 0,
          cheDo: r.cheDo || 0,
          congTacXa: r.congTacXa || 0,
          doMin: r.doMin || 0,
          benhXa: r.benhXa || 0,
          note: r.note || "",
        })),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Tìm kiếm theo ngày</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-center">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[220px]"
          />
        </CardContent>
      </Card>

      <PersonnelStrengthTable rows={rows} onRowsChange={handleRowsChange} date={date} canEdit={canEdit} />
    </div>
  );
}


