"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RotateCcw, Edit2, Layers } from "lucide-react";
import { toast } from "sonner";

// Estilos y configuraciones
const containerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 4.6097, lng: -74.0817 }; // Bogotá fallback
const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

// Interfaces
export interface PotreroGeometry {
  lat: number;
  lng: number;
}

export interface ExistingPolygon {
  id: string;
  nombre: string;
  geometry?: PotreroGeometry[];
}

export interface PotreroMapEditorProps {
  initialGeometry?: PotreroGeometry[];
  onPolygonComplete: (geometry: PotreroGeometry[], areaM2: number, areaHa: number) => void;
  onClose: () => void;
  apiKey: string;
  existingPolygons?: ExistingPolygon[];
  readOnly?: boolean;
}

// Helpers
function calculatePolygonArea(
  paths: google.maps.LatLng[],
  geometryLib: typeof google.maps.geometry | undefined
): number {
  if (!geometryLib || paths.length < 3) return 0;
  return Math.abs(geometryLib.spherical.computeArea(paths));
}

function getPolygonCenter(paths: PotreroGeometry[]): google.maps.LatLng | null {
  if (!paths || paths.length === 0) return null;
  const bounds = new google.maps.LatLngBounds();
  paths.forEach((p) => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
  return bounds.getCenter();
}

function PotreroMapEditorComponent({
  initialGeometry,
  onPolygonComplete,
  onClose,
  apiKey,
  existingPolygons = [],
  readOnly = false,
}: PotreroMapEditorProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [areaM2, setAreaM2] = useState<number>(0);
  const [areaHa, setAreaHa] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "hybrid">("hybrid");

  // Referencias para limpieza
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const editablePolygonRef = useRef<google.maps.Polygon | null>(null);
  const existingOverlaysRef = useRef<{ poly: google.maps.Polygon; label: google.maps.Marker }[]>([]);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  const currentInitial = useMemo(() => initialGeometry ?? [], [initialGeometry]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Limpieza de objetos del mapa
  const clearMapObjects = useCallback(() => {
    // Listeners
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];

    // Polígonos existentes y etiquetas
    existingOverlaysRef.current.forEach(({ poly, label }) => {
      poly.setMap(null);
      label.setMap(null);
    });
    existingOverlaysRef.current = [];

    // Polígono editable
    if (editablePolygonRef.current) {
      editablePolygonRef.current.setMap(null);
      editablePolygonRef.current = null;
    }

    // Drawing Manager
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }
    
    setIsEditing(false);
  }, []);

  // Lógica Principal de Renderizado
  useEffect(() => {
    if (!map || !isLoaded) return;

    clearMapObjects();

    // 1. Renderizar Polígonos Existentes (Contexto)
    if (existingPolygons.length > 0) {
      const overlays: { poly: google.maps.Polygon; label: google.maps.Marker }[] = [];

      existingPolygons.forEach((potrero) => {
        if (!potrero.geometry || potrero.geometry.length < 3) return;

        const path = potrero.geometry.map((p) => new google.maps.LatLng(p.lat, p.lng));

        // Dibujar polígono
        const poly = new google.maps.Polygon({
          paths: path,
          fillColor: "#9ca3af", // Gris neutro
          fillOpacity: 0.3,
          strokeColor: "#4b5563",
          strokeWeight: 1,
          clickable: false,
          map: map,
          zIndex: 1,
        });

        // Crear Label (Marker invisible con texto)
        const center = getPolygonCenter(potrero.geometry!);
        const labelMarker = new google.maps.Marker({
          position: center!,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0, // Invisible
          },
          label: {
            text: potrero.nombre,
            color: "white",
            fontWeight: "bold",
            fontSize: "12px",
            className: "map-label-shadow", // Clase CSS opcional para sombra
          },
          zIndex: 10,
        });

        overlays.push({ poly, label: labelMarker });
      });

      existingOverlaysRef.current = overlays;
    }

    // 2. Manejar Polígono "Activo" (Edición o Visualización del actual)
    if (currentInitial.length >= 3) {
      const path = currentInitial.map((p) => new google.maps.LatLng(p.lat, p.lng));

      const poly = new google.maps.Polygon({
        paths: path,
        editable: false,
        draggable: false,
        fillColor: "#3b82f6", // Azul primario
        fillOpacity: 0.4,
        strokeColor: "#1d4ed8",
        strokeWeight: 2,
        map: map,
        zIndex: 20, // Por encima de los vecinos
      });

      editablePolygonRef.current = poly;

      // Calcular área inicial
      const area = calculatePolygonArea(path, window.google?.maps?.geometry);
      setAreaM2(area);
      setAreaHa(area / 10000);

      // Centrar mapa en el polígono actual
      const bounds = new google.maps.LatLngBounds();
      path.forEach((ll) => bounds.extend(ll));
      map.fitBounds(bounds);
    } else {
      // 3. Si no hay polígono inicial, centrar según contexto
      if (existingPolygons.length > 0) {
        // Centrar en el conjunto de polígonos existentes
        const bounds = new google.maps.LatLngBounds();
        existingPolygons.forEach(p => {
            p.geometry?.forEach(c => bounds.extend(new google.maps.LatLng(c.lat, c.lng)));
        });
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
        } else {
            map.setCenter(defaultCenter);
            map.setZoom(15);
        }
      } else {
        map.setCenter(defaultCenter);
        map.setZoom(6);
      }
    }

    // 4. Configurar DrawingManager (solo si no es readOnly)
    if (!readOnly && currentInitial.length < 3) {
      initDrawingManager(map);
    }

    return () => {
        // Cleanup manejado por clearMapObjects al inicio del efecto
    };
  }, [map, isLoaded, currentInitial, existingPolygons, readOnly, clearMapObjects]);

  const initDrawingManager = (mapInstance: google.maps.Map) => {
    const drawingMgr = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: "#3b82f6",
        fillOpacity: 0.4,
        strokeColor: "#1d4ed8",
        strokeWeight: 2,
        clickable: false,
        editable: true, 
        zIndex: 20,
      },
      map: mapInstance,
    });

    drawingManagerRef.current = drawingMgr;

    const listener = drawingMgr.addListener("polygoncomplete", (poly: google.maps.Polygon) => {
      drawingMgr.setDrawingMode(null); // Desactivar modo dibujo para evitar múltiples polígonos
      
      // Si existía uno previo (caso borde), borrarlo
      if (editablePolygonRef.current) editablePolygonRef.current.setMap(null);
      
      editablePolygonRef.current = poly;
      
      updateMetrics(poly);
      
      // Añadir listeners para cambios en vértices
      const path = poly.getPath();
      listenersRef.current.push(path.addListener("set_at", () => updateMetrics(poly)));
      listenersRef.current.push(path.addListener("insert_at", () => updateMetrics(poly)));
      listenersRef.current.push(path.addListener("remove_at", () => updateMetrics(poly)));

      toast.success("Polígono creado. Puedes ajustar los puntos.");
      setIsEditing(true);
    });

    listenersRef.current.push(listener);
  };

  const updateMetrics = (poly: google.maps.Polygon) => {
    const paths = poly.getPath().getArray();
    const area = calculatePolygonArea(paths, window.google?.maps?.geometry);
    setAreaM2(area);
    setAreaHa(area / 10000);
  };

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapInstance.setMapTypeId(mapType);
  }, [mapType]);

  const handleEdit = useCallback(() => {
    const poly = editablePolygonRef.current;
    if (!poly) return;
    poly.setEditable(true);
    setIsEditing(true);
    
    // Reconectar listeners si se habían perdido
    const path = poly.getPath();
    google.maps.event.clearListeners(path, 'insert_at');
    google.maps.event.clearListeners(path, 'set_at');
    google.maps.event.clearListeners(path, 'remove_at');
    
    path.addListener("set_at", () => updateMetrics(poly));
    path.addListener("insert_at", () => updateMetrics(poly));
    path.addListener("remove_at", () => updateMetrics(poly));

    toast.info("Modo edición activado");
  }, []);

  const handleSave = useCallback(() => {
    const poly = editablePolygonRef.current;
    if (!poly) return;

    const paths = poly.getPath().getArray();
    if (paths.length < 3) {
      toast.error("El polígono debe tener al menos 3 puntos");
      return;
    }

    const geometry: PotreroGeometry[] = paths.map((latlng) => ({
      lat: latlng.lat(),
      lng: latlng.lng(),
    }));

    const area = calculatePolygonArea(paths, window.google?.maps?.geometry);
    
    poly.setEditable(false);
    setIsEditing(false);
    
    onPolygonComplete(geometry, area, area / 10000);
  }, [onPolygonComplete]);

  const handleReset = useCallback(() => {
    if (readOnly) return;
    
    if (editablePolygonRef.current) {
        editablePolygonRef.current.setMap(null);
        editablePolygonRef.current = null;
    }
    
    setAreaM2(0);
    setAreaHa(0);
    setIsEditing(false);

    // Reiniciar Drawing Manager
    if (map) {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setMap(null);
        }
        initDrawingManager(map);
    }
  }, [map, readOnly]);

  const toggleMapType = () => {
      const next = mapType === "satellite" ? "hybrid" : "satellite";
      setMapType(next);
      map?.setMapTypeId(next);
  }

  // Render (JSX) se mantiene casi igual, asegurando mostrar errores si falta API Key
  if (loadError) return <div className="p-4 text-red-500">Error cargando Maps. Revisa la API Key.</div>;
  if (!isLoaded) return <div className="p-4"><Loader2 className="animate-spin" /> Cargando mapa...</div>;

  return (
    <div className="space-y-4">
      {/* Barra de métricas */}
      {areaM2 > 0 && (
         <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-900">
            <span className="flex items-center gap-2"><MapPin size={16}/> Área:</span>
            <span className="font-mono font-bold">
                {areaHa.toLocaleString('es-CO', {maximumFractionDigits: 2})} Ha
                <span className="text-xs text-blue-600 font-normal ml-1">({areaM2.toLocaleString('es-CO', {maximumFractionDigits: 0})} m²)</span>
            </span>
         </div>
      )}

      <div className="border rounded-lg overflow-hidden relative h-[500px]">
         <div className="absolute top-2 right-2 z-10 bg-white rounded shadow p-1">
            <Button variant="ghost" size="icon" onClick={toggleMapType} title="Cambiar capa">
                <Layers className="h-4 w-4" />
            </Button>
         </div>
         
         <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={15}
            onLoad={onMapLoad}
            options={{
               mapTypeId: mapType,
               streetViewControl: false,
               mapTypeControl: false, // Usamos nuestro botón custom
               fullscreenControl: true
            }}
         />
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-2">
            {isEditing ? (
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Guardar Cambios</Button>
            ) : (
                editablePolygonRef.current && (
                    <Button variant="outline" onClick={handleEdit}><Edit2 className="w-4 h-4 mr-2"/> Editar</Button>
                )
            )}
            {editablePolygonRef.current && (
                <Button variant="destructive" size="icon" onClick={handleReset} title="Borrar"><RotateCcw className="w-4 h-4"/></Button>
            )}
             <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      )}
    </div>
  );
}

export default function PotreroMapEditor(props: PotreroMapEditorProps) {
    if (!props.apiKey) return <div>Falta API Key</div>;
    return <PotreroMapEditorComponent {...props} />;
}