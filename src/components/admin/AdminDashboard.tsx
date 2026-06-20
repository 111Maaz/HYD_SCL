import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Image, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdmissionLeads } from "@/services/admissions";
import { fetchAllClassMaterials } from "@/services/class-materials";
import { fetchAllFacultyMembers } from "@/services/faculty";
import { fetchAllGalleryImages } from "@/services/gallery";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

const MODULE_LINKS = ADMIN_NAV_ITEMS.filter((item) => item.to !== "/admin/dashboard");

export function AdminDashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ["admin", "admission-leads"],
    queryFn: fetchAdmissionLeads,
  });
  const { data: faculty = [] } = useQuery({
    queryKey: ["admin", "faculty-members"],
    queryFn: fetchAllFacultyMembers,
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["admin", "gallery-images"],
    queryFn: fetchAllGalleryImages,
  });
  const { data: materials = [] } = useQuery({
    queryKey: ["admin", "class-materials"],
    queryFn: fetchAllClassMaterials,
  });

  const newLeads = leads.filter((lead) => lead.status === "New").length;

  const stats = [
    { label: "New leads", value: newLeads, icon: Users },
    { label: "Faculty members", value: faculty.length, icon: GraduationCap },
    { label: "Gallery images", value: gallery.length, icon: Image },
    { label: "Class materials", value: materials.length, icon: BookOpen },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of admissions, faculty, gallery, and class materials."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {MODULE_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.to}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="size-5" />
                  {item.label}
                </CardTitle>
                <CardDescription>
                  Manage {item.label.toLowerCase()} from the admin portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={item.to} className="text-sm font-medium text-primary hover:underline">
                  Open {item.label} →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
