import React from "react";
import Button from "../buttons/button";
import Modal from "../modals/Modal";

export const AddUser: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return (
    <div>
      <Button onClick={open}>Add User</Button>

      {visible && (
        <Modal onClose={close}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary">
                Crear usuario
              </h2>
              <button
                onClick={close}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Primer nombre</label>
                <input
                  type="text"
                  placeholder="Primer nombre"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Apellidos</label>
                <input
                  type="text"
                  placeholder="Apellidos"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Teléfono"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Departamento</label>
                <input
                  type="text"
                  placeholder="Departamento"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Rol</label>
                <input
                  type="text"
                  placeholder="Rol"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={close}>
                Cancelar
              </Button>
              <Button onClick={close}>Guardar usuario</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
