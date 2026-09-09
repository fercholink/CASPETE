import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X, School } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedStudentRow {
  full_name: string;
  national_id?: string;
  grade?: string;
  parent_email: string;
  parent_name?: string;
  parent_phone?: string;
  allergies?: string;
  isValid: boolean;
  validationError?: string;
}

interface SchoolOption {
  id: string;
  name: string;
  city: string;
}

export default function StudentBulkImportModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(user?.school_id || '');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: { row: number; full_name: string; error: string }[];
  } | null>(null);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      setSchoolsLoading(true);
      apiClient.get('/schools/active')
        .then(res => {
          const raw = res.data?.data;
          const list: SchoolOption[] = Array.isArray(raw)
            ? raw
            : (Array.isArray(raw?.schools) ? raw.schools : []);
          setSchools(list);
          if (list.length > 0) {
            setSelectedSchoolId(prev => {
              if (prev && list.some(s => s.id === prev)) return prev;
              return list[0]?.id || '';
            });
          }
        })
        .catch(err => {
          console.error('Error cargando colegios activos, intentando fallback:', err);
          apiClient.get('/schools')
            .then(res2 => {
              const raw2 = res2.data?.data;
              const list2: SchoolOption[] = Array.isArray(raw2)
                ? raw2
                : (Array.isArray(raw2?.schools) ? raw2.schools : []);
              setSchools(list2);
              if (list2.length > 0) {
                setSelectedSchoolId(prev => {
                  if (prev && list2.some(s => s.id === prev)) return prev;
                  return list2[0]?.id || '';
                });
              }
            })
            .catch(() => {});
        })
        .finally(() => {
          setSchoolsLoading(false);
        });
    } else if (isOpen && !isSuperAdmin && user?.school_id) {
      setSelectedSchoolId(user.school_id);
    }

    if (isOpen) {
      setParsedRows([]);
      setFileName('');
      setImportResult(null);
      setGeneralError('');
    }
  }, [isOpen, isSuperAdmin, user?.school_id]);

  if (!isOpen) return null;

  // Descargar plantilla oficial de Excel con ejemplos
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nombre Completo *': 'Mateo Gómez Rodríguez',
        'Documento Identidad': '1023456789',
        'Grado o Curso': '3A',
        'Correo Acudiente *': 'papa.mateo@ejemplo.com',
        'Nombre Acudiente': 'Carlos Gómez',
        'Teléfono Acudiente': '3001234567',
        'Alergias (separadas por coma)': 'Maní, Lactosa',
      },
      {
        'Nombre Completo *': 'Valentina Morales Ruiz',
        'Documento Identidad': '1098765432',
        'Grado o Curso': '5B',
        'Correo Acudiente *': 'mama.valen@ejemplo.com',
        'Nombre Acudiente': 'Patricia Ruiz',
        'Teléfono Acudiente': '3159876543',
        'Alergias (separadas por coma)': '',
      },
      {
        'Nombre Completo *': 'Santiago Pérez Castro',
        'Documento Identidad': '1045678901',
        'Grado o Curso': 'Transición',
        'Correo Acudiente *': 'padres.santi@ejemplo.com',
        'Nombre Acudiente': 'Andrés Pérez',
        'Teléfono Acudiente': '3214364223',
        'Alergias (separadas por coma)': 'Gluten',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 30 }, // Nombre Completo
      { wch: 22 }, // Documento
      { wch: 16 }, // Grado
      { wch: 28 }, // Correo
      { wch: 24 }, // Nombre Acudiente
      { wch: 20 }, // Teléfono
      { wch: 30 }, // Alergias
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Alumnos');
    XLSX.writeFile(wb, 'plantilla_alumnos_kidway.xlsx');
  };

  // Procesar archivo Excel / CSV subido
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setGeneralError('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setGeneralError('El archivo Excel no tiene hojas de datos válidas.');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          setGeneralError('No se pudo leer la hoja de datos.');
          return;
        }

        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          setGeneralError('El archivo está vacío o no contiene filas con datos.');
          return;
        }

        const parsed: ParsedStudentRow[] = rawRows.map((row) => {
          // Mapeo flexible de nombres de columnas
          const fullName = String(row['Nombre Completo *'] || row['Nombre Completo'] || row['Nombre'] || row['Estudiante'] || '').trim();
          const doc = String(row['Documento Identidad'] || row['Documento'] || row['Identificación'] || row['TI'] || '').trim();
          const grade = String(row['Grado o Curso'] || row['Grado'] || row['Curso'] || row['Salon'] || '').trim();
          const parentEmail = String(row['Correo Acudiente *'] || row['Correo Acudiente'] || row['Email Acudiente'] || row['Correo'] || row['Email'] || '').trim().toLowerCase();
          const parentName = String(row['Nombre Acudiente'] || row['Acudiente'] || row['Padre'] || row['Madre'] || '').trim();
          const parentPhone = String(row['Teléfono Acudiente'] || row['Telefono Acudiente'] || row['Celular'] || row['Teléfono'] || '').trim();
          const allergies = String(row['Alergias (separadas por coma)'] || row['Alergias'] || row['Restricciones'] || '').trim();

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          let isValid = true;
          let validationError = '';

          if (!fullName || fullName.length < 2) {
            isValid = false;
            validationError = 'Nombre muy corto o vacío';
          } else if (!parentEmail || !emailRegex.test(parentEmail)) {
            isValid = false;
            validationError = 'Correo de acudiente inválido';
          }

          return {
            full_name: fullName,
            national_id: doc || undefined,
            grade: grade || undefined,
            parent_email: parentEmail,
            parent_name: parentName || undefined,
            parent_phone: parentPhone || undefined,
            allergies: allergies || undefined,
            isValid,
            validationError,
          };
        });

        setParsedRows(parsed);
      } catch {
        setGeneralError('Error al procesar el archivo Excel. Asegúrate de que sea un formato válido (.xlsx o .csv).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    if (isSuperAdmin && !selectedSchoolId) {
      setGeneralError('Debes seleccionar el colegio al cual se importarán los alumnos.');
      return;
    }

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setGeneralError('No hay filas válidas para importar. Corrige los errores en el archivo.');
      return;
    }

    setImporting(true);
    setGeneralError('');
    try {
      const payload = {
        school_id: isSuperAdmin ? selectedSchoolId : undefined,
        students: validRows.map(r => ({
          full_name: r.full_name,
          national_id: r.national_id ?? null,
          grade: r.grade ?? null,
          parent_email: r.parent_email,
          parent_name: r.parent_name ?? null,
          parent_phone: r.parent_phone ?? null,
          allergies: r.allergies ?? null,
        })),
      };

      const res = await apiClient.post<{
        data: {
          created: number;
          updated: number;
          errors: { row: number; full_name: string; error: string }[];
        };
      }>('/students/bulk-import', payload);

      setImportResult(res.data.data);
      onSuccess();
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || err?.response?.data?.error || 'Error al importar los alumnos');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, maxWidth: 840, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#0E2A22', color: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                Importación Masiva de Alumnos
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                Carga múltiples estudiantes con su grado, acudiente y alergias desde un archivo Excel o CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: 6, borderRadius: 8,
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* Selector de colegio si es SUPER_ADMIN */}
          {isSuperAdmin ? (
            <div style={{ marginBottom: 20, padding: 14, background: '#f1f5f9', borderRadius: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <School className="h-4 w-4 text-emerald-600" />
                  Selecciona el Colegio de Destino:
                </span>
                {schoolsLoading && (
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Cargando colegios...</span>
                )}
              </label>
              <select
                className="form-input"
                style={{ margin: 0, background: '#ffffff', cursor: 'pointer', fontWeight: 500 }}
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                disabled={schoolsLoading}
              >
                {schools.length === 0 ? (
                  <option value="">{schoolsLoading ? 'Cargando lista de colegios...' : 'No se encontraron colegios activos'}</option>
                ) : (
                  <>
                    <option value="" disabled>-- Selecciona un colegio ({schools.length} disponibles) --</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</option>
                    ))}
                  </>
                )}
              </select>
              {schools.length === 0 && !schoolsLoading && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626' }}>
                  No se pudieron cargar los colegios activos. Por favor verifica que existan colegios creados en el sistema.
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 20, padding: 12, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <School className="h-5 w-5 text-emerald-600" />
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Colegio de destino:</span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {user?.school?.name || 'Colegio Asignado'}
                </p>
              </div>
            </div>
          )}

          {/* Bloque 1: Descarga de plantilla y subida de archivo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Paso 1: Descargar Plantilla */}
            <div style={{
              padding: 16, borderRadius: 14, border: '1px dashed #cbd5e1',
              background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Paso 1
                </span>
                <h4 style={{ margin: '4px 0 6px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Descarga la Plantilla Excel
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  Usa nuestro formato predeterminado con columnas para nombre, grado, documento y correo del acudiente.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleDownloadTemplate}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, padding: '8px 14px' }}
              >
                <Download className="h-4 w-4 text-emerald-600" />
                Descargar Plantilla (.xlsx)
              </button>
            </div>

            {/* Paso 2: Subir Archivo */}
            <div style={{
              padding: 16, borderRadius: 14, border: '1px dashed #cbd5e1',
              background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Paso 2
                </span>
                <h4 style={{ margin: '4px 0 6px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Sube tu Archivo Diligenciado
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  Selecciona el archivo Excel (.xlsx) o CSV guardado desde tu computador.
                </p>
              </div>
              <label className="btn-primary" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 12, padding: '8px 14px', cursor: 'pointer', margin: 0,
              }}>
                <Upload className="h-4 w-4" />
                <span>{fileName ? 'Cambiar archivo' : 'Seleccionar archivo'}</span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {generalError && (
            <div style={{
              padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5',
              color: '#991b1b', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Resultado final de importación */}
          {importResult && (
            <div style={{
              padding: 16, borderRadius: 12, background: '#ecfdf5', border: '1px solid #10b981',
              color: '#065f46', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>¡Importación completada exitosamente!</h4>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 13 }}>
                • <strong>{importResult.created}</strong> estudiantes creados nuevos.<br />
                • <strong>{importResult.updated}</strong> estudiantes actualizados.<br />
                {importResult.errors.length > 0 && (
                  <span style={{ color: '#dc2626' }}>
                    • {importResult.errors.length} filas tuvieron inconsistencias y fueron omitidas.
                  </span>
                )}
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{ fontSize: 12, padding: '6px 14px' }}
              >
                Cerrar y ver estudiantes
              </button>
            </div>
          )}

          {/* Previsualización de filas leídas */}
          {parsedRows.length > 0 && !importResult && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Previsualización de Alumnos ({parsedRows.length} detectados)
                </h4>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>✓ {validCount} válidos</span>
                  {invalidCount > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {invalidCount} con error</span>
                  )}
                </div>
              </div>

              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Nombre Estudiante</th>
                      <th style={{ padding: '8px 10px' }}>Grado</th>
                      <th style={{ padding: '8px 10px' }}>Documento</th>
                      <th style={{ padding: '8px 10px' }}>Correo Acudiente</th>
                      <th style={{ padding: '8px 10px' }}>Alergias</th>
                      <th style={{ padding: '8px 10px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: r.isValid ? '#fff' : '#fffbeb',
                      }}>
                        <td style={{ padding: '8px 10px', color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.full_name || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>{r.grade || '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{r.national_id || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>{r.parent_email || '—'}</td>
                        <td style={{ padding: '8px 10px', color: r.allergies ? '#d97706' : 'var(--color-text-muted)' }}>
                          {r.allergies || 'Ninguna'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {r.isValid ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>✓ Listo</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 600 }} title={r.validationError}>
                              ⚠️ {r.validationError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
          background: '#f8fafc',
        }}>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={importing}>
            Cancelar
          </button>
          {parsedRows.length > 0 && !importResult && (
            <button
              type="button"
              className="btn-primary"
              disabled={importing || validCount === 0}
              onClick={handleConfirmImport}
              style={{ fontWeight: 700 }}
            >
              {importing ? 'Procesando importación...' : `Importar ${validCount} Alumnos`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
