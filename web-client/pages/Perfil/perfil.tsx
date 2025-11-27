import React, { useEffect, useState } from "react";
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

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const PerfilPage: React.FC = () => {
  const router = useRouter();
  const { token, ready } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pwdForm, setPwdForm] = useState({
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
          setError("No se pudo cargar el perfil.");
          setLoading(false);
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

  const handleChange =
    (field: keyof typeof form) =>
    (e: any) => {
      let value: string = e.target.value;

      if (field === "nombre" || field === "apellido") {
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g, "");
      }

      if (field === "telefono") {
        value = value.replace(/\D/g, "");
      }

      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleLettersKeyDown = (e: any) => {
    const key: string = e.key;

    if (key.length > 1) return;

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const handleNumbersKeyDown = (e: any) => {
    const key: string = e.key;

    if (key.length > 1) return;

    const regex = /^[0-9]$/;
    if (!regex.test(key)) {
      e.preventDefault();
    }
  };

  const doSaveProfile = async () => {
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    setConfirmSaveOpen(false);

    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.status === 204) {
        setSuccess("Perfil actualizado correctamente.");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                nombre: form.nombre,
                apellido: form.apellido,
                correo: form.correo,
                telefono: form.telefono,
              }
            : prev
        );
      } else if (res.status === 409) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "El correo ya está registrado.");
      } else if (res.status === 401) {
        router.replace("/login");
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "Error al guardar el perfil.");
      }
    } catch {
      setError("Error de red al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    setConfirmSaveOpen(true);
  };

  const handlePwdFieldChange =
    (field: keyof typeof pwdForm) =>
    (e: any) => {
      setPwdForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const doChangePassword = async () => {
    if (!token) return;

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

      if (!res.ok) {
        setPwdError(body?.message ?? "No se pudo cambiar la contraseña.");
      } else {
        setPwdSuccess(
          body?.message ?? "Contraseña actualizada correctamente."
        );
        setPwdForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
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

  const fechaRegistro = new Date(profile.fechaRegistro).toLocaleString();

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
      style={{ background: BG, color: TEXT }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <Text
          h2
          css={{
            color: TEXT,
            marginBottom: "1.5rem",
            fontWeight: 600,
          }}
        >
          Mi perfil
        </Text>

        <Card
          css={{
            bg: CARD_BG,
            borderRadius: "26px",
            border: `1px solid ${BORDER_SUBTLE}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
            padding: "28px 30px 24px",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <Text size="$sm" css={{ color: MUTED, letterSpacing: 0.4 }}>
              Información básica
            </Text>
            {profile.estadoUsuario && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: estadoEsActivo
                    ? "rgba(52,211,153,0.09)"
                    : "rgba(248,113,113,0.08)",
                  color: estadoEsActivo ? "#6EE7B7" : "#FCA5A5",
                  border: `1px solid ${
                    estadoEsActivo
                      ? "rgba(52,211,153,0.35)"
                      : "rgba(248,113,113,0.35)"
                  }`,
                }}
              >
                {estadoLabel}
              </span>
            )}
          </div>

          <Spacer y={1} />

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

          <div className="grid gap-4 md:grid-cols-1">
            <Input
              label="Fecha de registro"
              value={fechaRegistro}
              readOnly
              fullWidth
              bordered
              css={readonlyInputCss}
              size="lg"
            />
          </div>

          <Spacer y={1.5} />

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
              disabled={saving}
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
                bg: "transparent",
                borderRadius: "999px",
                border: `1px solid ${BORDER_SUBTLE}`,
                color: MUTED,
                fontWeight: 500,
                px: "$10",
                "&:hover": {
                  bg: "#1F2933",
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
                fontWeight: 600,
                px: "$12",
                "&:hover": {
                  opacity: 0.92,
                },
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>

          <Spacer y={2} />
          <div className="mt-4 border-t border-white/5 pt-5">
            <div className="flex items-center justify-between gap-4">
              <Text size="$sm" css={{ color: MUTED, letterSpacing: 0.4 }}>
                Seguridad
              </Text>
            </div>

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
                  fontWeight: 600,
                  px: "$12",
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
                onClick={() => setConfirmSaveOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200"
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
                css={{
                  bg: ACCENT,
                  color: "white",
                  borderRadius: "999px",
                  px: "$10",
                  fontWeight: 600,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                Guardar
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
                onClick={() => setConfirmPwdOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200"
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
                css={{
                  bg: ACCENT,
                  color: "white",
                  borderRadius: "999px",
                  px: "$10",
                  fontWeight: 600,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilPage;
