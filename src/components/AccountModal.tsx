import React, { useState, useEffect } from 'react';
import { X, Check, Building2, User, Phone, Mail, FileText, MapPin } from 'lucide-react';
import { CustomerAccount, WAREHOUSE_ZONES } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: CustomerAccount | null;
  onSave: (account: CustomerAccount) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<CustomerAccount>>({
    code: '',
    customer: '',
    defaultZone: WAREHOUSE_ZONES[0],
    contactPerson: '',
    contactPhone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({ ...account });
    } else {
      setFormData({
        code: 'ACC-',
        customer: '',
        defaultZone: WAREHOUSE_ZONES[0],
        contactPerson: '',
        contactPhone: '',
        email: '',
        notes: '',
      });
    }
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = (formData.code || '').trim().toUpperCase();
    const cleanCustomer = (formData.customer || '').trim();

    if (!cleanCode || !cleanCustomer) return;

    const finalAccount: CustomerAccount = {
      id: account ? account.id : `ACC-${Math.floor(100 + Math.random() * 900)}`,
      code: cleanCode,
      customer: cleanCustomer,
      defaultZone: formData.defaultZone || WAREHOUSE_ZONES[0],
      contactPerson: formData.contactPerson?.trim() || undefined,
      contactPhone: formData.contactPhone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      createdAt: account?.createdAt || new Date().toISOString(),
    };

    onSave(finalAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {account ? `Chỉnh Sửa Account / Khách Hàng: ${account.code}` : 'Thêm Mới Account / Khách Hàng'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý mã đối tác, tên chủ hàng và phân kho lưu trữ mặc định
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Mã Account & Tên Khách Hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mã Account (Viết hoa) *
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: ACC-SAMSUNG, ACC-LG..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phân Kho Mặc Định *
              </label>
              <select
                value={formData.defaultZone || WAREHOUSE_ZONES[0]}
                onChange={(e) => setFormData({ ...formData, defaultZone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {WAREHOUSE_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên Khách Hàng / Shipper Nhập Hàng *
            </label>
            <input
              type="text"
              required
              value={formData.customer || ''}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              placeholder="VD: Samsung Electronics VN, Unilever Việt Nam..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Người Liên Hệ / Phụ Trách
              </label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="VD: Nguyễn Văn A (Logistics Lead)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Số Điện Thoại / Hotline
              </label>
              <input
                type="text"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="VD: 0912-345-678"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              Email Khách Hàng / Phòng Logistics
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="VD: logistics@customer.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Notes / Special requirements */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Ghi Chú Đặc Thù / Quy Chuẩn Vận Hành
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Hàng giá trị cao cần kiểm đếm serial, cont lạnh 2-8°C, quy cách san thùng 50 thùng/pallet..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Check className="w-4 h-4" />
            {account ? 'Cập Nhật Account' : 'Thêm Account Mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
