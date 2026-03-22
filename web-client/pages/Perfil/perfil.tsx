import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Button, Card, Input, Spacer, Text } from "@nextui-org/react";
import { useSession } from "../../components/hooks/useSession";

const BG = "#05070A";
const CARD_BG = "#121618";
const FIELD_BG_EDITABLE = "#181F26";
const FIELD_BG_READONLY = "#14191F";
const BORDER = "rgba(255,255,255,0.16)";
const BORDER_SUBTLE = "rgba(255,255,255,0.10)";
const TEXT = "#E6E9EA";
const TEXT_STRONG = "#F9FAFB";
const MUTED = "#8B9AA0";
const ACCENT = "#A30862";

type UserProfile = {
  usuarioID: number;
  nombre: string;
  apellido?: string | null;
  correo: string;
  telefono?: string | null;
  rol: string;
  fechaRegistro: string;
  lastLogin?: string | null;
  estadoUsuario: string;
};

type ProfileForm = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type InputChangeElement = HTMLInputElement | HTMLTextAreaElement;
type InputChangeEvent = React.ChangeEvent<InputChangeElement>;
type InputKeyboardEvent = React.KeyboardEvent<InputChangeElement>;

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const normalizePhone = (value: string): string => value.replace(/\D/g, "");

const sanitizeNameInput = (value: string): string =>
  value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]/g, "");

const formatDateTime = (value?: string | null): string => {
  if (!value) return "No disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const PerfilPage: React.FC = () => {
  const router = useRouter();
  const { token, ready } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pwdForm, setPwdForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmPwdOpen, setConfirmPwdOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.message ?? "No se pudo cargar el perfil.");
          return;
        }

        const data: UserProfile = await res.json();

        setProfile(data);
        setForm({
          nombre: data.nombre ?? "",
          apellido: data.apellido ?? "",
          correo: data.correo ?? "",
          telefono: data.telefono ?? "",
        });
      } catch {
        setError("Error de red al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [ready, token, router]);

  const isDirty = useMemo(() => {
    if (!profile) return false;

    return (
      normalizeText(form.nombre) !== normalizeText(profile.nombre ?? "") ||
      normalizeText(form.apellido) !== normalizeText(profile.apellido ?? "") ||
      normalizeText(form.correo).toLowerCase() !==
        normalizeText(profile.correo ?? "").toLowerCase() ||
      normalizePhone(form.telefono) !== normalizePhone(profile.telefono ?? "")
    );
  }, [form, profile]);

  const userInitials = useMemo(() => {
    const first = normalizeText(form.nombre || profile?.nombre || "")
      .charAt(0)
      .toUpperCase();
    const second = normalizeText(form.apellido || profile?.apellido || "")
      .charAt(0)
      .toUpperCase();

    return `${first || "U"}${second || ""}`;
  }, [form.nombre, form.apellido, profile?.nombre, profile?.apellido]);

  const handleChange =
    (field: keyof ProfileForm) =>
    (e: InputChangeEvent) => {
      let value = e.target.value;

      if (field === "nombre" || field === "apellido") {
        value = sanitizeNameInput(value);
      }

      if (field === "telefono") {
        value = normalizePhone(value);
      }

      setForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
      setSuccess(null);
    };

  const handleLettersKeyDown = (e: InputKeyboardEvent) => {
    const key = e.key;

    if (key.length > 1) return;

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const handleNumbersKeyDown = (e: InputKeyboardEvent) => {
    const key = e.key;

    if (key.length > 1) return;

    const regex = /^[0-9]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const validateProfileForm = (): string | null => {
    const nombre = normalizeText(form.nombre);
    const apellido = normalizeText(form.apellido);
    const correo = normalizeText(form.correo).toLowerCase();
    const telefono = normalizePhone(form.telefono);

    if (!nombre) return "El nombre es obligatorio.";
    if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (nombre.length > 100) return "El nombre no puede exceder 100 caracteres.";
    if (!NAME_REGEX.test(nombre))
      return "El nombre contiene caracteres no permitidos.";

    if (!apellido) return "El apellido es obligatorio.";
    if (apellido.length < 2)
      return "El apellido debe tener al menos 2 caracteres.";
    if (apellido.length > 100)
      return "El apellido no puede exceder 100 caracteres.";
    if (!NAME_REGEX.test(apellido))
      return "El apellido contiene caracteres no permitidos.";

    if (!correo) return "El correo es obligatorio.";
    if (correo.length > 256) return "El correo no puede exceder 256 caracteres.";
    if (!EMAIL_REGEX.test(correo)) return "Correo inválido.";

    if (!telefono) return "El teléfono es obligatorio.";
    if (telefono.length < 8 || telefono.length > 20) {
      return "El teléfono debe tener entre 8 y 20 dígitos.";
    }

    return null;
  };

  const doSaveProfile = async () => {
    if (!token || saving) return;

    const validationError = validateProfileForm();
    if (validationError) {
      setError(validationError);
      setConfirmSaveOpen(false);
      return;
    }

    if (!isDirty) {
      setSuccess("No hay cambios para guardar.");
      setError(null);
      setConfirmSaveOpen(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setConfirmSaveOpen(false);

    const payload: ProfileForm = {
      nombre: normalizeText(form.nombre),
      apellido: normalizeText(form.apellido),
      correo: normalizeText(form.correo).toLowerCase(),
      telefono: normalizePhone(form.telefono),
    };

    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);

      if (res.ok) {
        setSuccess(body?.message ?? "Perfil actualizado correctamente.");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                nombre: payload.nombre,
                apellido: payload.apellido,
                correo: payload.correo,
                telefono: payload.telefono,
              }
            : prev
        );
        setForm(payload);
        return;
      }

      if (res.status === 409) {
        setError(body?.message ?? "El correo ya está registrado.");
        return;
      }

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      setError(body?.message ?? "Error al guardar el perfil.");
    } catch {
      setError("Error de red al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    setError(null);
    setSuccess(null);

    const validationError = validateProfileForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isDirty) {
      setSuccess("No hay cambios para guardar.");
      return;
    }

    setConfirmSaveOpen(true);
  };

  const handlePwdFieldChange =
    (field: keyof PasswordForm) =>
    (e: InputChangeEvent) => {
      setPwdForm((prev) => ({ ...prev, [field]: e.target.value }));
      setPwdError(null);
      setPwdSuccess(null);
    };

  const doChangePassword = async () => {
    if (!token || pwdSaving) return;

    setPwdError(null);
    setPwdSuccess(null);
    setConfirmPwdOpen(false);

    setPwdSaving(true);
    try {
      const res = await fetch(`${API}/auth/password/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      });

      const body = await res.json().catch(() => null);

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        setPwdError(body?.message ?? "No se pudo cambiar la contraseña.");
        return;
      }

      setPwdSuccess(body?.message ?? "Contraseña actualizada correctamente.");
      setPwdForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setPwdError("Error de red al cambiar la contraseña.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleChangePasswordClick = () => {
    setPwdError(null);
    setPwdSuccess(null);

    if (
      !pwdForm.currentPassword ||
      !pwdForm.newPassword ||
      !pwdForm.confirmPassword
    ) {
      setPwdError("Todos los campos de contraseña son obligatorios.");
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (pwdForm.currentPassword === pwdForm.newPassword) {
      setPwdError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(pwdForm.newPassword)) {
      setPwdError(
        "La nueva contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números."
      );
      return;
    }

    setConfirmPwdOpen(true);
  };

  if (!ready || loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: BG }}
      >
        <Text css={{ color: TEXT }}>Cargando perfil...</Text>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: BG }}
      >
        <Text css={{ color: TEXT }}>
          {error ?? "No se encontró el perfil."}
        </Text>
      </div>
    );
  }

  const fechaRegistro = formatDateTime(profile.fechaRegistro);
  const ultimoAcceso = formatDateTime(profile.lastLogin);

  const estadoLabelMap: Record<string, string> = {
    ACTIVE: "Activo",
    PAUSED: "Pausado",
    VACATION: "Vacaciones",
  };

  const estadoUpper = (profile.estadoUsuario ?? "").toUpperCase();
  const estadoLabel =
    estadoLabelMap[estadoUpper] ?? profile.estadoUsuario ?? "";
  const estadoEsActivo = estadoUpper === "ACTIVE";

  const editableInputCss = {
    bg: FIELD_BG_EDITABLE,
    borderRadius: "18px",
    border: `1px solid ${BORDER}`,
    color: TEXT_STRONG,
    "& input": {
      color: TEXT_STRONG,
      fontWeight: 500,
      fontSize: "0.96rem",
    },
    "& label": {
      color: "#AEB7C0",
      fontWeight: 500,
    },
    "&:hover": {
      borderColor: "rgba(255,255,255,0.22)",
    },
    "&:focus-within": {
      borderColor: ACCENT,
      boxShadow: `0 0 0 1px ${ACCENT}`,
    },
  } as const;

  const readonlyInputCss = {
    bg: FIELD_BG_READONLY,
    borderRadius: "18px",
    border: `1px solid ${BORDER_SUBTLE}`,
    color: TEXT,
    "& input": {
      color: TEXT,
      fontWeight: 400,
      fontSize: "0.94rem",
    },
    "& label": {
      color: MUTED,
      fontWeight: 500,
    },
  } as const;

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        background:
          "radial-gradient(circle at top, rgba(163,8,98,0.10), transparent 24%), #05070A",
        color: TEXT,
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <Text
          h2
          css={{
            color: TEXT,
            marginBottom: "0.4rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Mi perfil
        </Text>
        <Text
          css={{
            color: MUTED,
            marginBottom: "1.5rem",
            fontSize: "0.98rem",
          }}
        >
          Administra tu información personal y la seguridad de tu cuenta.
        </Text>

        <Card
          css={{
            bg: CARD_BG,
            borderRadius: "28px",
            border: `1px solid ${BORDER_SUBTLE}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
            padding: "30px 30px 24px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 22%)",
            }}
          />

          <div className="relative z-[1] mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(163,8,98,0.95), rgba(214,51,132,0.82))",
                  color: "#FFFFFF",
                  boxShadow: "0 12px 30px rgba(163,8,98,0.28)",
                }}
              >
                {userInitials}
              </div>

              <div>
                <Text
                  css={{
                    color: TEXT_STRONG,
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    lineHeight: 1.1,
                  }}
                >
                  {`${form.nombre || profile.nombre} ${form.apellido || profile.apellido || ""}`.trim()}
                </Text>
                <Text
                  css={{
                    color: MUTED,
                    fontSize: "0.94rem",
                    marginTop: "0.18rem",
                  }}
                >
                  {form.correo || profile.correo}
                </Text>
              </div>
            </div>

            {profile.estadoUsuario && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  alignSelf: "flex-start",
                  background: estadoEsActivo
                    ? "rgba(52,211,153,0.09)"
                    : "rgba(248,113,113,0.08)",
                  color: estadoEsActivo ? "#6EE7B7" : "#FCA5A5",
                  border: `1px solid ${
                    estadoEsActivo
                      ? "rgba(52,211,153,0.35)"
                      : "rgba(248,113,113,0.35)"
                  }`,
                  boxShadow: estadoEsActivo
                    ? "0 0 18px rgba(52,211,153,0.10)"
                    : "0 0 18px rgba(248,113,113,0.10)",
                }}
              >
                {estadoLabel}
              </span>
            )}
          </div>

          <div className="mb-5 h-px w-full bg-white/5" />

          <Text
            size="$sm"
            css={{
              color: MUTED,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Información básica
          </Text>

          <Spacer y={0.9} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={handleChange("nombre")}
              onKeyDown={handleLettersKeyDown}
              fullWidth
              bordered
              css={editableInputCss}
              size="lg"
              maxLength={100}
              autoComplete="given-name"
            />
            <Input
              label="Apellido"
              value={form.apellido}
              onChange={handleChange("apellido")}
              onKeyDown={handleLettersKeyDown}
              fullWidth
              bordered
              css={editableInputCss}
              size="lg"
              maxLength={100}
              autoComplete="family-name"
            />
          </div>

          <Spacer y={0.8} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Correo"
              type="email"
              value={form.correo}
              onChange={handleChange("correo")}
              fullWidth
              bordered
              css={editableInputCss}
              size="lg"
              maxLength={256}
              autoComplete="email"
            />
            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={handleChange("telefono")}
              onKeyDown={handleNumbersKeyDown}
              fullWidth
              bordered
              css={editableInputCss}
              size="lg"
              maxLength={20}
              autoComplete="tel"
            />
          </div>

          <Spacer y={1} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Rol"
              value={profile.rol}
              readOnly
              fullWidth
              bordered
              css={readonlyInputCss}
              size="lg"
            />
            <Input
              label="Estado"
              value={estadoLabel}
              readOnly
              fullWidth
              bordered
              css={readonlyInputCss}
              size="lg"
            />
          </div>

          <Spacer y={1} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Fecha de registro"
              value={fechaRegistro}
              readOnly
              fullWidth
              bordered
              css={readonlyInputCss}
              size="lg"
            />
            <Input
              label="Último acceso"
              value={ultimoAcceso}
              readOnly
              fullWidth
              bordered
              css={readonlyInputCss}
              size="lg"
            />
          </div>

          <Spacer y={1.4} />

          {error && (
            <Text
              size="$sm"
              css={{
                color: "#FCA5A5",
                marginBottom: "0.4rem",
              }}
            >
              {error}
            </Text>
          )}

          {success && (
            <Text
              size="$sm"
              css={{
                color: "#6EE7B7",
                marginBottom: "0.4rem",
              }}
            >
              {success}
            </Text>
          )}

          <div className="mt-1 flex flex-col gap-3 md:flex-row md:justify-end">
            <Button
              auto
              flat
              disabled={saving || !isDirty}
              onClick={() => {
                if (!profile) return;

                setForm({
                  nombre: profile.nombre ?? "",
                  apellido: profile.apellido ?? "",
                  correo: profile.correo ?? "",
                  telefono: profile.telefono ?? "",
                });
                setError(null);
                setSuccess(null);
              }}
              css={{
                bg: isDirty ? "#FFFFFF" : "#000000",
                borderRadius: "999px",
                border: `1px solid ${
                  isDirty
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.08)"
                }`,
                color: isDirty ? "#111827" : "#E5E7EB",
                fontWeight: 600,
                px: "$10",
                transition: "all 0.18s ease",
                "&:hover": {
                  bg: isDirty ? "#F3F4F6" : "#0B0B0B",
                },
              }}
            >
              Deshacer cambios
            </Button>

            <Button
              auto
              disabled={saving}
              onClick={handleSaveClick}
              css={{
                bg: ACCENT,
                color: "white",
                borderRadius: "999px",
                fontWeight: 700,
                px: "$12",
                boxShadow: "0 12px 24px rgba(163,8,98,0.22)",
                transition: "all 0.18s ease",
                "&:hover": {
                  opacity: 0.92,
                },
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>

          <Spacer y={2} />

          <div className="mt-3 border-t border-white/5 pt-6">
            <div className="flex items-center justify-between gap-4">
              <Text
                size="$sm"
                css={{
                  color: MUTED,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Seguridad
              </Text>
            </div>

            <Text
              css={{
                color: MUTED,
                fontSize: "0.9rem",
                marginTop: "0.45rem",
              }}
            >
              Usa una contraseña segura con al menos 8 caracteres, mayúsculas,
              minúsculas y números.
            </Text>

            <Spacer y={1} />

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Contraseña actual"
                type="password"
                value={pwdForm.currentPassword}
                onChange={handlePwdFieldChange("currentPassword")}
                fullWidth
                bordered
                css={editableInputCss}
                size="lg"
                autoComplete="current-password"
              />
              <Input
                label="Nueva contraseña"
                type="password"
                value={pwdForm.newPassword}
                onChange={handlePwdFieldChange("newPassword")}
                fullWidth
                bordered
                css={editableInputCss}
                size="lg"
                autoComplete="new-password"
              />
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                value={pwdForm.confirmPassword}
                onChange={handlePwdFieldChange("confirmPassword")}
                fullWidth
                bordered
                css={editableInputCss}
                size="lg"
                autoComplete="new-password"
              />
            </div>

            <Spacer y={1} />

            {pwdError && (
              <Text
                size="$sm"
                css={{ color: "#FCA5A5", marginBottom: "0.3rem" }}
              >
                {pwdError}
              </Text>
            )}

            {pwdSuccess && (
              <Text
                size="$sm"
                css={{ color: "#6EE7B7", marginBottom: "0.3rem" }}
              >
                {pwdSuccess}
              </Text>
            )}

            <div className="flex justify-end">
              <Button
                auto
                disabled={pwdSaving}
                onClick={handleChangePasswordClick}
                css={{
                  bg: "transparent",
                  borderRadius: "999px",
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  fontWeight: 700,
                  px: "$12",
                  transition: "all 0.18s ease",
                  "&:hover": {
                    bg: "rgba(163,8,98,0.12)",
                  },
                }}
              >
                {pwdSaving ? "Actualizando..." : "Cambiar contraseña"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {confirmSaveOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111318] px-8 py-7 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Text b css={{ color: TEXT_STRONG, fontSize: "1.1rem" }}>
                Guardar cambios
              </Text>
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <Text css={{ color: TEXT, fontSize: "0.95rem" }}>
              ¿Confirmas guardar los cambios de tu perfil?
            </Text>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                auto
                onClick={() => setConfirmSaveOpen(false)}
                disabled={saving}
                css={{
                  bg: "#111827",
                  color: TEXT,
                  borderRadius: "999px",
                  px: "$10",
                  border: `1px solid ${BORDER_SUBTLE}`,
                  "&:hover": { bg: "#1F2937" },
                }}
              >
                Cancelar
              </Button>
              <Button
                auto
                onClick={doSaveProfile}
                disabled={saving}
                css={{
                  bg: ACCENT,
                  color: "white",
                  borderRadius: "999px",
                  px: "$10",
                  fontWeight: 600,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmPwdOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111318] px-8 py-7 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Text b css={{ color: TEXT_STRONG, fontSize: "1.1rem" }}>
                Cambiar contraseña
              </Text>
              <button
                type="button"
                onClick={() => setConfirmPwdOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                disabled={pwdSaving}
              >
                ✕
              </button>
            </div>

            <Text css={{ color: TEXT, fontSize: "0.95rem" }}>
              ¿Confirmas cambiar tu contraseña? Se cerrarán tus otras sesiones
              activas.
            </Text>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                auto
                onClick={() => setConfirmPwdOpen(false)}
                disabled={pwdSaving}
                css={{
                  bg: "#111827",
                  color: TEXT,
                  borderRadius: "999px",
                  px: "$10",
                  border: `1px solid ${BORDER_SUBTLE}`,
                  "&:hover": { bg: "#1F2937" },
                }}
              >
                Cancelar
              </Button>
              <Button
                auto
                onClick={doChangePassword}
                disabled={pwdSaving}
                css={{
                  bg: ACCENT,
                  color: "white",
                  borderRadius: "999px",
                  px: "$10",
                  fontWeight: 600,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                {pwdSaving ? "Actualizando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilPage;