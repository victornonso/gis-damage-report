"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { List as ListIcon, Map as MapIcon } from "lucide-react";

import { Search, ThumbsUp, Calendar, User } from "lucide-react";
import Link from "next/link";
import { LatLngExpression } from "leaflet";

// dynamic imports for SSR safety
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// status → color map
const markerColors: Record<string, string> = {
  submitted: "#F59E0B",    // yellow-500
  "in-progress": "#3B82F6",// blue-500
  resolved: "#10B981",     // green-500
};

const statusLabels = {
  submitted: "Submitted",
  "in-progress": "In Progress",
  resolved: "Resolved",
} as const;

const urgencyColors = {
  low: "border-green-200 bg-green-50",
  medium: "border-yellow-200 bg-yellow-50",
  high: "border-orange-200 bg-orange-50",
  critical: "border-red-200 bg-red-50",
} as const;

type Report = {
  id: number;
  title: string;
  description: string;
  status: keyof typeof markerColors;
  urgency: keyof typeof urgencyColors;
  latitude: number;
  longitude: number;
  ward?: string;
  street?: string;
  landmark?: string;
  upvotes: number;
  created_at: string;
  reported_by?: string;
};

export default function MapPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const searchParams = useSearchParams()
  const reportIdParam = searchParams.get("reportId")


  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    lga: "all",
    ward: "all",
    search: "",
  });

  const [mapReports, setMapReports]   = useState<Report[]>([]);
  const [listReports, setListReports] = useState<Report[]>([]);

  const [totalReports, setTotalReports] = useState(0);
  const [page, setPage] = useState(1);
  const reportsPerPage = 5;
  const totalPages = Math.ceil(totalReports / reportsPerPage);
  const [lgaOptions, setLgaOptions] = useState<string[]>([])

  const [mobileListVisible, setMobileListVisible] = useState(false);

  // Fetch reports on filter change
  useEffect(() => {
    setLoading(true);

    // build the shared filter params
    const base = new URLSearchParams();
    if (filters.status   !== "all") base.append("status",   filters.status);
    if (filters.category !== "all") base.append("category", filters.category);
    if (filters.lga      !== "all") base.append("lga",      filters.lga);
    if (filters.ward     !== "all") base.append("ward",     filters.ward);
    if (filters.search)              base.append("search",   filters.search);

    // load **all** matching for the map
    fetch(`/api/reports?${base.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        setMapReports(json.reports || []);
      })
      .catch((e) => {
        setMapReports([]);
      });

    // 2load **this page** for the list
    base.set("limit",  reportsPerPage.toString());
    base.set("offset", ((page - 1) * reportsPerPage).toString());

    fetch(`/api/reports?${base.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        setListReports(json.reports || []);
        setTotalReports(json.total  || 0);
      })
      .catch((e) => {
        setListReports([]);
        setTotalReports(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters, page]);

  const paginatedReports = reports;

  useEffect(() => {
    fetch("/api/reports/lgas")
      .then(r => r.json())
      .then(setLgaOptions);
  }, []);


  // Map center: if single report focus there
  const mapCenter: LatLngExpression = selectedReport ? [selectedReport.latitude, selectedReport.longitude] : [6.5244, 3.3792]

  // Upvote toggle handler
  const handleToggleUpvote = async (reportId: number) => {
    if (!userId) {
      alert("Please sign in to upvote.");
      return;
    }
    try {
      const res = await fetch(`/api/reports/${reportId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        return;
      }
      const { report: updated } = await res.json();
      
      // Update detail modal if open
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r))
      if (selectedReport?.id === updated.id) setSelectedReport(updated)
    } catch (err) {
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER + FILTERS */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Issues Map</h1>
            <div className="flex gap-2">
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileListVisible(!mobileListVisible)}
                >
                  {mobileListVisible ? <MapIcon  className="w-4 h-4" /> : <ListIcon  className="w-4 h-4" />}
                  <span className="ml-2">{mobileListVisible ? "Map" : "List"}</span>
                </Button>
              )}
              <Button asChild>
                <Link href="/report">Report New Issue</Link>
              </Button>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 ">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-48"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(status) => setFilters({ ...filters, status })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.category}
              onValueChange={(category) => setFilters({ ...filters, category })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="roads">Roads</SelectItem>
                <SelectItem value="streetlights">Street Lights</SelectItem>
                <SelectItem value="drainage">Drainage</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="water">Water</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.lga}
              onValueChange={(lga) => setFilters(f => ({ ...f, lga }))
            }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All LGAs" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="all">All LGAs</SelectItem>
                {lgaOptions.map((lga) => (
                  <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Map */}
        <div className={`flex-1 ${isMobile && mobileListVisible ? "hidden" : "block"}`}>
          <MapContainer center={mapCenter} zoom={reportIdParam ? 14 : 12} className="w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapReports.map((r) => (
              <CircleMarker
                key={r.id}
                center={[r.latitude, r.longitude]}
                radius={8}
                pathOptions={{
                  color: markerColors[r.status],
                  fillColor: markerColors[r.status],
                  fillOpacity: 1,
                }}
                eventHandlers={{ click: () => setSelectedReport(r) }}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-xs">{r.ward} • {r.street}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className={`w-96 bg-white border-l overflow-y-auto ${isMobile && !mobileListVisible ? "hidden" : "block"}`}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              Reports {loading ? "..." : `(${totalReports})`}
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="text-gray-500 mt-2">Loading reports...</p>
              </div>
            ) : !listReports.length ? (
              <p className="text-center text-gray-500">No reports found.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {listReports.map((rep) => (
                    <Card
                      key={rep.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        selectedReport?.id === rep.id ? "ring-2 ring-blue-500" : ""
                      } ${urgencyColors[rep.urgency] ?? "border-gray-200 bg-gray-50"}`}
                      onClick={() => setSelectedReport(rep)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium line-clamp-2">{rep.title}</CardTitle>
                          <Badge
                            className="text-white text-xs"
                            style={{ backgroundColor: markerColors[rep.status] }}
                          >
                            {statusLabels[rep.status]}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">{rep.ward} • {rep.street}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{rep.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{rep.upvotes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      Prev
                    </Button>
                    <span className="text-sm self-center">Page {page} of {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">
                    {selectedReport.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      className="text-white"
                      style={{
                        backgroundColor:
                          markerColors[selectedReport.status],
                      }}
                    >
                      {statusLabels[selectedReport.status]}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedReport.urgency} Priority
                    </Badge>
                  </div>
                  <CardDescription>
                    {selectedReport.ward} • {selectedReport.street}
                    {selectedReport.landmark &&
                      ` • ${selectedReport.landmark}`}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <MapContainer
                  center={[
                    selectedReport.latitude,
                    selectedReport.longitude,
                  ] as LatLngExpression}
                  zoom={14}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <CircleMarker
                    center={[
                      selectedReport.latitude,
                      selectedReport.longitude,
                    ] as LatLngExpression}
                    radius={8}
                    pathOptions={{
                      color: markerColors[selectedReport.status],
                      fillColor: markerColors[selectedReport.status],
                      fillOpacity: 1,
                    }}
                  />
                </MapContainer>
              </div>

              <h4 className="font-medium">Description</h4>
              <p className="text-gray-600">
                {selectedReport.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Reported by:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <User className="h-4 w-4" />
                    <span>{selectedReport.reported_by}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        selectedReport.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleUpvote(selectedReport.id)}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Upvote ({selectedReport.upvotes})
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Share
                  </Button>
                  <Button size="sm">Get Directions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
