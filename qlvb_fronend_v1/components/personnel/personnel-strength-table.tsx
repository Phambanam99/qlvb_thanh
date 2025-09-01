"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface PersonnelRowInput {
  id: string | number;
  unitName: string;
  siQuan?: number; // Officers
  qncn?: number; // Professional soldiers
  hsqBs?: number; // Non-commissioned officers/Privates
  phepTT?: number; // Leave
  vien?: number; // Hospitalized
  hocXa?: number; // Studying away
  cheDo?: number; // On policy/benefits
  congTacXa?: number; // Business trip away
  doMin?: number; // Mine clearance
  benhXa?: number; // Infirmary
  note?: string;
}

export interface PersonnelStrengthTableProps {
  date?: string;
  rows: PersonnelRowInput[];
  onRowsChange?: (rows: PersonnelRowInput[]) => void;
  canEdit?: boolean;
}

function toNumber(value: number | undefined): number {
  return Number.isFinite(value as number) ? (value as number) : 0;
}

export function PersonnelStrengthTable({ rows, onRowsChange, canEdit = false }: PersonnelStrengthTableProps) {

  const handleChange = (
    rowIndex: number,
    field:
      | "siQuan"
      | "qncn"
      | "hsqBs"
      | "phepTT"
      | "vien"
      | "hocXa"
      | "cheDo"
      | "congTacXa"
      | "doMin"
      | "benhXa"
      | "note",
    value: string
  ) => {
    const cloned = [...rows];
    const current = { ...cloned[rowIndex] } as PersonnelRowInput;
    if (field === "note") {
      current.note = value;
    } else {
      const numeric = value === "" ? 0 : parseInt(value, 10) || 0;
      (current as any)[field] = numeric;
    }
    cloned[rowIndex] = current;
    onRowsChange?.(cloned);
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const siQuan = toNumber(row.siQuan);
        const qncn = toNumber(row.qncn);
        const hsqBs = toNumber(row.hsqBs);
        const vm =
          toNumber(row.phepTT) +
          toNumber(row.vien) +
          toNumber(row.hocXa) +
          toNumber(row.cheDo) +
          toNumber(row.congTacXa) +
          toNumber(row.doMin) +
          toNumber(row.benhXa);

        const qs = siQuan + qncn + hsqBs;
        const coMat = qs - vm;

        acc.siQuan += siQuan;
        acc.qncn += qncn;
        acc.hsqBs += hsqBs;
        acc.quanSo += qs;
        acc.vangMat += vm;
        acc.coMat += coMat;
        acc.phepTT += toNumber(row.phepTT);
        acc.vien += toNumber(row.vien);
        acc.hocXa += toNumber(row.hocXa);
        acc.cheDo += toNumber(row.cheDo);
        acc.congTacXa += toNumber(row.congTacXa);
        acc.doMin += toNumber(row.doMin);
        acc.benhXa += toNumber(row.benhXa);
        return acc;
      },
      {
        siQuan: 0,
        qncn: 0,
        hsqBs: 0,
        quanSo: 0,
        coMat: 0,
        vangMat: 0,
        phepTT: 0,
        vien: 0,
        hocXa: 0,
        cheDo: 0,
        congTacXa: 0,
        doMin: 0,
        benhXa: 0,
      }
    );
  }, [rows]);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="w-[48px] text-center align-middle">TT</TableHead>
              <TableHead rowSpan={2} className="min-w-[220px] align-middle">Đơn vị</TableHead>
              <TableHead colSpan={4} className="text-center">Quân số</TableHead>
              <TableHead rowSpan={2} className="text-center align-middle">Có mặt</TableHead>
              <TableHead colSpan={8} className="text-center">Vắng mặt</TableHead>
              <TableHead rowSpan={2} className="min-w-[160px] align-middle">Ghi chú</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">Sĩ quan</TableHead>
              <TableHead className="text-center">QNCN</TableHead>
              <TableHead className="text-center">HSQ-BS</TableHead>
              <TableHead className="text-center">Tổng</TableHead>
              <TableHead className="text-center">Phép TT</TableHead>
              <TableHead className="text-center">Viện</TableHead>
              <TableHead className="text-center">Học xa</TableHead>
              <TableHead className="text-center">Chế độ</TableHead>
              <TableHead className="text-center">Công tác xa</TableHead>
              <TableHead className="text-center">Dò mìn</TableHead>
              <TableHead className="text-center">Bệnh xá</TableHead>
              <TableHead className="text-center">Tổng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const siQuan = toNumber(row.siQuan);
              const qncn = toNumber(row.qncn);
              const hsqBs = toNumber(row.hsqBs);
              const quanSo = siQuan + qncn + hsqBs;
              const vangMat =
                toNumber(row.phepTT) +
                toNumber(row.vien) +
                toNumber(row.hocXa) +
                toNumber(row.cheDo) +
                toNumber(row.congTacXa) +
                toNumber(row.doMin) +
                toNumber(row.benhXa);
              const coMat = quanSo - vangMat;

              return (
                <TableRow key={row.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="font-medium">{row.unitName}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={siQuan}
                      onChange={(e) => handleChange(index, "siQuan", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={qncn}
                      onChange={(e) => handleChange(index, "qncn", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={hsqBs}
                      onChange={(e) => handleChange(index, "hsqBs", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell className="text-center font-semibold">{quanSo}</TableCell>
                  <TableCell className="text-center font-semibold">{coMat}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.phepTT)}
                      onChange={(e) => handleChange(index, "phepTT", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.vien)}
                      onChange={(e) => handleChange(index, "vien", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.hocXa)}
                      onChange={(e) => handleChange(index, "hocXa", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.cheDo)}
                      onChange={(e) => handleChange(index, "cheDo", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.congTacXa)}
                      onChange={(e) => handleChange(index, "congTacXa", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.doMin)}
                      onChange={(e) => handleChange(index, "doMin", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={toNumber(row.benhXa)}
                      onChange={(e) => handleChange(index, "benhXa", e.target.value)}
                      className="h-9 w-20"
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell className="text-center font-semibold">{vangMat}</TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={row.note || ""}
                      onChange={(e) => handleChange(index, "note", e.target.value)}
                      className="h-9"
                      disabled={!canEdit}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Totals row */}
            <TableRow className="bg-muted/40">
              <TableCell className="text-center font-semibold" colSpan={2}>
                Tổng quân số
              </TableCell>
              <TableCell className="font-semibold">{totals.siQuan}</TableCell>
              <TableCell className="font-semibold">{totals.qncn}</TableCell>
              <TableCell className="font-semibold">{totals.hsqBs}</TableCell>
              <TableCell className="text-center font-semibold">{totals.quanSo}</TableCell>
              <TableCell className="text-center font-semibold">{totals.coMat}</TableCell>
              <TableCell className="font-semibold">{totals.phepTT}</TableCell>
              <TableCell className="font-semibold">{totals.vien}</TableCell>
              <TableCell className="font-semibold">{totals.hocXa}</TableCell>
              <TableCell className="font-semibold">{totals.cheDo}</TableCell>
              <TableCell className="font-semibold">{totals.congTacXa}</TableCell>
              <TableCell className="font-semibold">{totals.doMin}</TableCell>
              <TableCell className="font-semibold">{totals.benhXa}</TableCell>
              <TableCell className="text-center font-semibold">{totals.vangMat}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default PersonnelStrengthTable;


