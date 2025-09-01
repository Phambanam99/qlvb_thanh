"use client";

import { useEffect, useState } from "react";
import { orgStructureAPI, type UnitNode, type PositionHolder, type ProfileSummary, type CareerItem, type GroupedHolders } from "@/lib/api/org-structure";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, User2, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OrgChartMockPage() {
  const [tree, setTree] = useState<UnitNode | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitNode | null>(null);
  const [holders, setHolders] = useState<PositionHolder[]>([]);
  const [grouped, setGrouped] = useState<GroupedHolders[] | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PositionHolder | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [career, setCareer] = useState<CareerItem[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupCache, setGroupCache] = useState<Record<number, GroupedHolders[]>>({});
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");

  const ensureGroupsLoaded = async (unitId: number) => {
    if (groupCache[unitId]) return;
    const grp = await orgStructureAPI.getGroupedHolders(unitId);
    setGroupCache((prev) => ({ ...prev, [unitId]: grp }));
  };

  useEffect(() => {
    orgStructureAPI.getUnitTree("current").then(async (t) => {
      setTree(t);
      setSelectedUnit(t);
      setExpanded(new Set([t.id]));
      await ensureGroupsLoaded(t.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedUnit) return;
    Promise.all([
      orgStructureAPI.getPositionHolders(selectedUnit.id),
      orgStructureAPI.getGroupedHolders(selectedUnit.id),
    ]).then(([flat, grp]) => {
      setHolders(flat);
      setGrouped(grp);
    });
    setSelectedPerson(null);
    setProfile(null);
    setCareer([]);
  }, [selectedUnit]);

  const openProfile = async (p: PositionHolder) => {
    setSelectedPerson(p);
    const [sum, car] = await Promise.all([
      orgStructureAPI.getProfileSummary(p.id),
      orgStructureAPI.getCareerTimeline(p.id),
    ]);
    setProfile(sum);
    setCareer(car);
  };

  const toggleExpand = (nodeId: number) => {
    const willExpand = !expanded.has(nodeId);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
    if (willExpand) void ensureGroupsLoaded(nodeId);
  };

  const toggleGroup = (unitId: number, label: string) => {
    const key = `${unitId}:${label}`;
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const TreeNode = ({ node, level }: { node: UnitNode; level: number }) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = !!node.children && node.children.length > 0;
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/60">
          {hasChildren ? (
            <button
              className="p-1 text-muted-foreground hover:text-foreground transition rounded"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
            >
              <ChevronRight className={`h-4 w-4 ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          ) : (
            <span className="w-4" />
          )}
          <div
            className={`flex-1 flex items-center gap-2 rounded px-2 py-1 cursor-pointer ${selectedUnit?.id === node.id ? "bg-primary/10 text-primary" : ""}`}
            style={{ paddingLeft: level * 5 }}
            onClick={() => { setSelectedUnit(node); toggleExpand(node.id); }}
          >
            <Users className="h-4 w-4" />
            <span className="truncate font-medium">{node.name}</span>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-1 ml-3 border-l pl-2 space-y-1">
            {hasChildren &&
              node.children!.map((child) => (
                <TreeNode key={child.id} node={child} level={level + 1} />
              ))}
            {(groupCache[node.id] || []).map((g) => {
              const groupKey = `${node.id}:${g.label}`;
              const isGroupExpanded = expandedGroups.has(groupKey);
              return (
                <div key={g.label} className="w-full">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/40">
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground transition rounded"
                      onClick={(e) => { e.stopPropagation(); toggleGroup(node.id, g.label); }}
                      aria-label={isGroupExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                      <ChevronRight className={`h-4 w-4 ${isGroupExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <div
                      className="text-sm font-medium text-muted-foreground flex-1"
                      style={{ paddingLeft: (level + 1) * 5 }}
                    >
                      {g.label}
                      <span className="ml-2 text-xs text-muted-foreground/80">({g.people.length})</span>
                    </div>
                  </div>
                  {isGroupExpanded && (
                    <div className="mt-1 ml-3 border-l pl-2 space-y-1">
                      {g.people.map((p) => (
                        <div
                          key={p.id}
                          className={`px-2 py-1 rounded-md hover:bg-muted/40 cursor-pointer flex items-center gap-2 ${selectedPerson?.id === p.id ? "bg-primary/10 text-primary" : ""}`}
                          style={{ paddingLeft: (level + 2) * 5 }}
                          onClick={() => openProfile(p)}
                        >
                          <User2 className="h-4 w-4" />
                          <span className="truncate">{p.fullName} - {p.positionTitle}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Left sidebar */}
      <div className="md:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tổ chức biên chế</CardTitle>
          </CardHeader>
          <CardContent>
            {!tree ? (
              <div>Đang tải...</div>
            ) : (
              <div className="space-y-1">
                <TreeNode node={tree} level={0} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle column removed per request; use only 2 columns layout */}

      {/* Right column: group + profile */}
      <div className="md:col-span-9 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{selectedUnit?.name || "Đơn vị"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!grouped || grouped.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <div className="space-y-4">
                {grouped.map((g, idx) => (
                  <div key={idx}>
                    <div className="font-semibold mb-2">{g.label}</div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {g.people.map((h) => (
                        <Button key={h.id} variant="outline" className="justify-start" onClick={() => openProfile(h)}>
                          <User2 className="h-4 w-4 mr-2" /> {h.fullName} - {h.positionTitle}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hồ sơ tóm tắt</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPerson ? (
              <div className="text-sm text-muted-foreground">Chọn một cán bộ để xem hồ sơ</div>
            ) : !profile ? (
              <div>Đang tải hồ sơ...</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex gap-4">
                  {profile.photoUrl && (
                    <img src={profile.photoUrl} alt={profile.fullName} className="h-24 w-18 object-cover border" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-base">BẢN TÓM TẮT LÝ LỊCH</div>
                    <div className="mt-1">Họ tên khai sinh: <span className="font-medium text-primary uppercase">{profile.fullName}</span></div>
                    <div>Số hiệu: {profile.serviceNumber || "—"}</div>
                    <div>Cấp bậc, hệ số lương, tháng năm: {profile.rank}</div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div>Sinh ngày: {profile.birthDate}</div>
                  <div>Dân tộc: {profile.ethnicity || "—"}</div>
                  <div>Tôn giáo: {profile.religion || "—"}</div>
                  <div>Quê quán: {profile.hometown}</div>
                  <div>Nơi ở hiện nay: {profile.currentResidence}</div>
                  <div>Ngày nhập ngũ: {profile.enlistDate || "—"}</div>
                  <div>Xuất ngũ: {profile.demobilizationDate || "—"}</div>
                  <div>Ngày vào Đảng: {profile.partyJoinDate || "—"}</div>
                  <div>Ngày chính thức: {profile.partyOfficialDate || "—"}</div>
                  <div>Giáo dục phổ thông: {profile.generalEducation || "—"}</div>
                </div>
                <div>
                  <div className="font-medium">Quá trình đào tạo:</div>
                  <ul className="list-disc pl-5">
                    {profile.training.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
                <div>Danh hiệu được phong, thăng năm: {profile.titles || "—"}</div>
                {profile.awards && profile.awards.length > 0 && (
                  <div>
                    <div>Khen thưởng:</div>
                    <ul className="list-disc pl-5">
                      {profile.awards.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                <div>Kỷ luật: {profile.discipline || "Không"}</div>
                <div>Đảng viên: {profile.partyMember ? "Có" : "Không"}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quá trình công tác</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPerson ? (
              <div className="text-sm text-muted-foreground">Chọn một cán bộ để xem quá trình công tác</div>
            ) : career.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              <div className="text-xs">
                <div className="grid grid-cols-12 font-medium border-b pb-1">
                  <div className="col-span-2">Từ</div>
                  <div className="col-span-2">Đến</div>
                  <div className="col-span-4">Chức vụ, đơn vị, binh chủng</div>
                  <div className="col-span-2">Cấp bậc, hệ số</div>
                  <div className="col-span-2">Chức vụ Đảng/Đoàn</div>
                </div>
                {career.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 py-1 border-b last:border-0">
                    <div className="col-span-2">{c.from}</div>
                    <div className="col-span-2">{c.to}</div>
                    <div className="col-span-4">{c.role} – {c.unit}</div>
                    <div className="col-span-2">{c.rankAtThatTime || ""}</div>
                    <div className="col-span-2">{c.partyRole || ""}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


