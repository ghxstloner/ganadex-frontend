"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RotateCcw, Edit2, Layers } from "lucide-react";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 4.6097, // Colombia (Bogotá)
  lng: -74.0817,
};

// Librerías de Google Maps necesarias
const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

export interface PotreroGeometry {
  lat: number;
  lng: number;
}

export interface PotreroMapEditorProps {
  /** Polígono inicial para editar (opcional) */
  initialGeometry?: PotreroGeometry[];
  /** Callback cuando se completa el polígono */
  onPolygonComplete: (geometry: PotreroGeometry[], areaM2: number, areaHa: number) => void;
  /** Callback cuando se cierra el editor */
  onClose: () => void;
  /** API Key de Google Maps */
  apiKey: string;
}

/**
 * Calcula el área de un polígono usando la fórmula del shoelace en metros cuadrados
 * Utiliza la biblioteca de geometría de Google Maps
 */
function calculatePolygonArea(
  paths: google.maps.LatLng[],
  geometry: typeof google.maps.geometry
): number {
  if (!geometry || paths.length < 3) return 0;

  // Calcular área usando spherical geometry de Google Maps
  const areaInM2 = geometry.spherical.computeArea(paths);
  return Math.abs(areaInM2);
}

function PotreroMapEditorComponent({
  initialGeometry,
  onPolygonComplete,
  onClose,
  apiKey,
}: PotreroMapEditorProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [currentPath, setCurrentPath] = useState<PotreroGeometry[]>([]);
  const [areaM2, setAreaM2] = useState<number>(0);
  const [areaHa, setAreaHa] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "hybrid">("hybrid");
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Inicializar mapa con polígono existente si hay
  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);

      // Esperar a que Google Maps esté completamente cargado
      setTimeout(() => {
        // Si hay geometría inicial, renderizarla
        if (initialGeometry && initialGeometry.length > 0) {
          const path = initialGeometry.map((p) => new google.maps.LatLng(p.lat, p.lng));

          // Calcular área inicial
          if (window.google?.maps?.geometry) {
            const area = calculatePolygonArea(path, window.google.maps.geometry);
            setAreaM2(area);
            setAreaHa(area / 10000);
          }

          // Crear polígono visual
          const poly = new google.maps.Polygon({
            paths: path,
            editable: false,
            draggable: false,
            fillColor: "#3b82f6",
            fillOpacity: 0.35,
            strokeColor: "#1e40af",
            strokeWeight: 2,
          });

          poly.setMap(mapInstance);
          polygonRef.current = poly;
          setPolygon(poly);
          setCurrentPath(initialGeometry);

          // Ajustar vista al polígono
          const bounds = new google.maps.LatLngBounds();
          path.forEach((latlng) => bounds.extend(latlng));
          mapInstance.fitBounds(bounds);
        } else {
          // Si no hay geometría, centrar en Colombia
          mapInstance.setCenter(defaultCenter);
          mapInstance.setZoom(6);
        }

        // Configurar DrawingManager solo si no hay polígono inicial
        if (!initialGeometry || initialGeometry.length === 0) {
          const drawingMgr = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
              fillColor: "#3b82f6",
              fillOpacity: 0.35,
              strokeColor: "#1e40af",
              strokeWeight: 2,
              clickable: false,
              editable: false,
              draggable: false,
            },
          });

          drawingMgr.setMap(mapInstance);
          drawingManagerRef.current = drawingMgr;
          setDrawingManager(drawingMgr);

          // Listener para cuando se completa el dibujo
          drawingMgr.addListener("polygoncomplete", (poly: google.maps.Polygon) => {
            // Desactivar modo de dibujo
            drawingMgr.setDrawingMode(null);

            // Obtener path del polígono
            const paths = poly.getPath().getArray();
            const geometry: PotreroGeometry[] = paths.map((latlng) => ({
              lat: latlng.lat(),
              lng: latlng.lng(),
            }));

            // Calcular área
            if (window.google?.maps?.geometry) {
              const area = calculatePolygonArea(paths, window.google.maps.geometry);
              setAreaM2(area);
              setAreaHa(area / 10000);
            }

            setPolygon(poly);
            setCurrentPath(geometry);
            polygonRef.current = poly;

            toast.success("Polígono dibujado correctamente");
          });
        }
      }, 100);
    },
    [initialGeometry]
  );

  // Habilitar edición del polígono
  const handleEdit = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setEditable(true);
      polygonRef.current.setDraggable(false);
      setIsEditing(true);

      // Listener para cambios durante la edición
      const path = polygonRef.current.getPath();
      const updateArea = () => {
        const paths = path.getArray();
        const geometry: PotreroGeometry[] = paths.map((latlng) => ({
          lat: latlng.lat(),
          lng: latlng.lng(),
        }));

        if (window.google?.maps?.geometry) {
          const area = calculatePolygonArea(paths, window.google.maps.geometry);
          setAreaM2(area);
          setAreaHa(area / 10000);
        }

        setCurrentPath(geometry);
      };

      path.addListener("set_at", updateArea);
      path.addListener("insert_at", updateArea);
      path.addListener("remove_at", updateArea);

      toast.info("Modo edición activado. Arrastra los puntos para editar.");
    }
  }, []);

  // Eliminar y volver a dibujar
  const handleReset = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
      setPolygon(null);
      setCurrentPath([]);
      setAreaM2(0);
      setAreaHa(0);
      setIsEditing(false);

      // Re-habilitar DrawingManager
      if (drawingManagerRef.current && map) {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        toast.info("Listo para dibujar un nuevo polígono");
      }
    }
  }, [map]);

  // Guardar y cerrar
  const handleSave = useCallback(() => {
    if (currentPath.length < 3) {
      toast.error("El polígono debe tener al menos 3 puntos");
      return;
    }

    if (isEditing && polygonRef.current) {
      // Obtener path actualizado si estaba en edición
      const paths = polygonRef.current.getPath().getArray();
      const geometry: PotreroGeometry[] = paths.map((latlng) => ({
        lat: latlng.lat(),
        lng: latlng.lng(),
      }));

      let area = areaM2;
      if (window.google?.maps?.geometry) {
        area = calculatePolygonArea(paths, window.google.maps.geometry);
      }

      onPolygonComplete(geometry, area, area / 10000);
    } else if (currentPath.length >= 3) {
      onPolygonComplete(currentPath, areaM2, areaHa);
    }
  }, [currentPath, areaM2, areaHa, isEditing, onPolygonComplete]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-red-50 border-red-200">
        <p className="text-red-600 font-medium">Error al cargar Google Maps</p>
        <p className="text-sm text-red-500 mt-2">Verifica que la API key sea válida</p>
        <Button variant="ghost" onClick={onClose} className="mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando Google Maps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Información del área */}
      {(areaM2 > 0 || currentPath.length > 0) && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-900">Área calculada</div>
            <div className="text-xs text-blue-700">
              {areaM2 > 0 ? (
                <>
                  {areaM2.toLocaleString("es-CO", { maximumFractionDigits: 2 })} m² •{" "}
                  {areaHa.toLocaleString("es-CO", { maximumFractionDigits: 4 })} ha
                </>
              ) : (
                "Calculando..."
              )}
            </div>
          </div>
          {currentPath.length > 0 && (
            <div className="text-xs text-blue-600">
              {currentPath.length} punto{currentPath.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div className="border rounded-lg overflow-hidden relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newType = mapType === "satellite" ? "hybrid" : "satellite";
              setMapType(newType);
              if (map) {
                map.setMapTypeId(newType);
              }
            }}
            className="bg-white/95 backdrop-blur-sm shadow-sm hover:bg-white"
          >
            <Layers className="h-4 w-4 mr-2" />
            {mapType === "satellite" ? "Mostrar etiquetas" : "Ocultar etiquetas"}
          </Button>
        </div>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={initialGeometry?.[0] ? { lat: initialGeometry[0].lat, lng: initialGeometry[0].lng } : defaultCenter}
          zoom={initialGeometry && initialGeometry.length > 0 ? 15 : 6}
          onLoad={onMapLoad}
          options={{
            mapTypeId: mapType,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_LEFT,
              mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain"],
            },
            streetViewControl: false,
            fullscreenControl: true,
          }}
        />
      </div>

      {/* Instrucciones */}
      {currentPath.length === 0 && (
        <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">Instrucciones:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Usa la herramienta de dibujo en la parte superior del mapa</li>
            <li>Haz clic para crear puntos del polígono</li>
            <li>Haz doble clic o cierra el polígono para completar</li>
            <li>El área se calculará automáticamente</li>
            <li>Puedes cambiar entre vista satelital e híbrida (con nombres de lugares) usando el botón en la esquina superior derecha</li>
          </ul>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-between items-center gap-2 pt-2 border-t">
        <div className="flex gap-2">
          {currentPath.length > 0 && !isEditing && (
            <Button type="button" variant="outline" onClick={handleEdit} size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {currentPath.length > 0 && (
            <Button type="button" variant="outline" onClick={handleReset} size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Borrar y volver a dibujar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={currentPath.length < 3}
            size="sm"
          >
            {currentPath.length >= 3 ? "Guardar polígono" : "Mínimo 3 puntos requeridos"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Wrapper con dynamic import para evitar SSR
export default function PotreroMapEditor(props: PotreroMapEditorProps) {
  // Verificar que apiKey esté disponible
  if (!props.apiKey || props.apiKey.trim() === "") {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-yellow-50 border-yellow-200">
        <p className="text-yellow-700 font-medium">API Key de Google Maps no configurada</p>
        <p className="text-sm text-yellow-600 mt-2">
          Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en las variables de entorno
        </p>
        <Button variant="ghost" onClick={props.onClose} className="mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  return <PotreroMapEditorComponent {...props} />;
}
