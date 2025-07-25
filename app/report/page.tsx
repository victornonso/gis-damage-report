// app/report/page.tsx
"use client"

import dynamic from "next/dynamic"
import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Camera,
  Loader2,
  CheckCircle,
  Locate,
} from "lucide-react"
import Link from "next/link"
import { useMapEvents, useMap} from "react-leaflet"

// Dynamically import Leaflet components (SSR-safe)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
)

// Helper to detect when Leaflet map is fully ready


export default function ReportPage() {
  const { data: session, status } = useSession()

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    landmark: "",
    lga: "",
    ward: "",
    street: "",
    urgency: "medium",
  })

  // Map state
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<any>(null)
  const [dropMode, setDropMode] = useState(false)
  const [isMapReady, setMapReady] = useState(false)

  function ClickHandler({ dropMode, onMapClick }: { dropMode: boolean; onMapClick: (e: any) => void }) {
    useMapEvents({
      click(e) {
        if (dropMode) onMapClick(e)
      },
    })
    return null
  }

  function MapLoader({ onReady }: { onReady: () => void }) {
    const map = useMap()
    useEffect(() => {

      if (!mapRef.current) {
        mapRef.current = map
      }

      map.whenReady(() => {
        onReady()
      })
    }, [map, onReady])
    return null
  }

  const centerOnUser = () => {
  if (!navigator.geolocation) {
    return Swal.fire({
      icon: "error",
      title: "Geolocation Unsupported",
      text: "Your browser does not support geolocation.",
    })
  }


     const tryZoom = () => {
       navigator.geolocation.getCurrentPosition(
         ({ coords }) => {
           if (!mapRef.current) {
             setTimeout(tryZoom, 200)
             return
           }
           mapRef.current.flyTo([coords.latitude, coords.longitude], 12, { duration: 1.2 })
         },
         (err) => {
           Swal.fire({
             icon: "error",
             title: "Location Error",
             text:
               err.code === err.PERMISSION_DENIED
                 ? "Permission denied. Please allow location access."
                 : "Unable to retrieve your location.",
           })
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
       )
     }

     tryZoom()
   }


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== "authenticated") {
      return Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "You must be logged in to submit a report.",
      })
    }

    if (!markerPos) {
      return Swal.fire({
        icon: "warning",
        title: "Location Required",
        text: "Please drop a pin on the map to mark the issue location.",
      })
    }

    setSubmitting(true)
    try {
      const payload = {
        title: formData.title.slice(0, 500),
        description: formData.description.slice(0, 500),
        category: formData.category,
        urgency: formData.urgency,
        ward: formData.ward.slice(0, 500),
        street: formData.street.slice(0, 500),
        landmark: formData.landmark.slice(0, 500),
        lga: formData.lga.slice(0, 500),
        location: markerPos,
        user_id: session.user.id,
        photo_url: null,
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        return Swal.fire("Submission Failed", data.error || "Unknown error", "error")
      }

      await Swal.fire({ icon: "success", title: "Submitted!", text: "Your report has been submitted successfully." })
      setSubmitted(true)
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "Network Error", text: err.message ?? "Could not reach the server." })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Report Submitted Successfully!</h2>
              <p className="text-gray-600 mb-6">Your report has been submitted to the relevant Local Government Area. You’ll receive notifications as the status updates.</p>
              <div className="flex gap-4 justify-center">
                <Button type="button" asChild><Link href="/reports">View My Reports</Link></Button>
                <Button type="button" variant="outline" asChild><Link href="/map">View on Map</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Report a Public Issue</h1>
        <p className="text-gray-600 mb-6">Help improve your community by reporting infrastructure problems, damages, or safety concerns.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Details */}
          <Card>
            <CardHeader><CardTitle>Issue Details</CardTitle><CardDescription>Describe the problem you want to report</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="title">Issue Title *</Label><Input id="title" placeholder="e.g., Large pothole on Lagos-Ibadan road" value={formData.title} maxLength={500} onChange={e => setFormData({ ...formData, title: e.target.value.slice(0,500) })} required /></div>
              <div><Label htmlFor="category">Category *</Label><Select value={formData.category} onValueChange={value => setFormData({ ...formData, category: value })}><SelectTrigger><SelectValue placeholder="Select issue category"/></SelectTrigger><SelectContent><SelectItem value="roads">Roads & Potholes</SelectItem><SelectItem value="drainage">Drainage & Flooding</SelectItem><SelectItem value="streetlights">Street Lighting</SelectItem><SelectItem value="waste">Waste Management</SelectItem><SelectItem value="water">Water Supply</SelectItem><SelectItem value="security">Security Concerns</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="description">Description *</Label><Textarea id="description" placeholder="Provide detailed description of the issue..." value={formData.description} maxLength={500} onChange={e => setFormData({ ...formData, description: e.target.value.slice(0,500) })} rows={4} required /></div>
              <div><Label htmlFor="urgency">Urgency Level</Label><Select value={formData.urgency} onValueChange={value => setFormData({ ...formData, urgency: value })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="low">Low - Minor inconvenience</SelectItem><SelectItem value="medium">Medium - Moderate impact</SelectItem><SelectItem value="high">High - Safety concern</SelectItem><SelectItem value="critical">Critical - Emergency</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader><CardTitle>Location Information</CardTitle><CardDescription>Help us locate the issue accurately</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div> <Label htmlFor="lga">Local Government Area *</Label> <Input id="lga" placeholder="e.g., Ikeja" value={formData.lga} maxLength={500} onChange={e =>  setFormData({ ...formData, lga: e.target.value.slice(0,500) })  } required /></div>
              <div className="flex gap-4"><div className="flex-1"><Label htmlFor="ward">Ward</Label><Input id="ward" placeholder="e.g., Victoria Island" value={formData.ward} maxLength={500} onChange={e => setFormData({ ...formData, ward: e.target.value.slice(0,500) })}/></div>
              <div className="flex-1"><Label htmlFor="street">Street/Area</Label><Input id="street" placeholder="e.g., Ahmadu Bello Way" value={formData.street} maxLength={500} onChange={e => setFormData({ ...formData, street: e.target.value.slice(0,500) })}/></div></div>
              <div><Label htmlFor="landmark">Nearby Landmark</Label><Input id="landmark" placeholder="e.g., Near First Bank, opposite Shoprite" value={formData.landmark} maxLength={500} onChange={e => setFormData({ ...formData, landmark: e.target.value.slice(0,500) })}/></div>
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Location on Map</CardTitle><CardDescription>Drop a pin at the issue location</CardDescription></div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={centerOnUser} disabled={!isMapReady}><Locate className="h-4 w-4 mr-1"/>My Location</Button>
                  <Button type="button" size="sm" variant={dropMode ? "default" : "outline"} onClick={() => setDropMode(m => !m)}><MapPin className="h-4 w-4 mr-1"/>{dropMode ? "Click map to set" : "Drop Pin"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-gray-600"><MapPin className="h-4 w-4 text-gray-500"/><span>{dropMode ? "Click anywhere on the map to place your pin" : markerPos ? `Pin at ${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)}` : "Click “Drop Pin” to pick location"}</span></div>
              <div className="w-full h-64 rounded overflow-hidden">
                <MapContainer center={[6.5244,3.3792]} zoom={12} whenCreated={undefined} eventHandlers={undefined} className="w-full h-full">
                  <MapLoader onReady={() => setMapReady(true)} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  <ClickHandler dropMode={dropMode} onMapClick={e => { setMarkerPos({ lat: e.latlng.lat, lng: e.latlng.lng }); setDropMode(false); }} />
                  {markerPos && <><CircleMarker center={[markerPos.lat,markerPos.lng]} radius={8} pathOptions={{ color: "#EF4444", fillOpacity: 1 }}/>                    <Marker position={[markerPos.lat,markerPos.lng]} draggable eventHandlers={{ dragend(e) { const m = e.target.getLatLng(); setMarkerPos({ lat: m.lat, lng: m.lng }); } }} /></>}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Photo Evidence */}
          <Card>
            <CardHeader><CardTitle>Photo Evidence</CardTitle><CardDescription>Upload a photo to help illustrate the issue</CardDescription></CardHeader>
            <CardContent><div className="flex items-center justify-center w-full"><label htmlFor="photo" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"><div className="flex flex-col items-center justify-center pt-5 pb-6">{photoPreview ? <img src={photoPreview} alt="Preview" className="h-20 w-20 object-cover rounded"/> : <><Camera className="w-8 h-8 mb-2 text-gray-500"/><p className="text-sm text-gray-500">Click to upload photo</p></>}</div><input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange}/></label></div></CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={submitting||!formData.title||!formData.description||!formData.category} className="flex-1">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting...</> : "Submit Report"}</Button>
            <Button type="button" variant="outline" asChild><Link href="/">Cancel</Link></Button>
          </div>
        </form>
      </div>
    </div>
  )
}
