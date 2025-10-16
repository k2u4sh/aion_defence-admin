"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { CheckIcon } from "@/icons";

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile: string;
  companyName: string;
  companyType: string;
  roles: string[];
  alternateEmail?: string;
  bio?: string;
  // New mapped fields
  addresses?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    address?: string;
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  billingAddresses?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    address?: string;
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean };
    newsletter?: boolean;
    language?: string;
    timezone?: string;
  };
  subscription?: {
    currentPlan?: 'FREE' | 'GOLD' | 'PLATINUM';
    autoRenew?: boolean;
    billingCycle?: 'monthly' | 'yearly';
  };
  sellerProfile?: {
    businessLicense?: string;
    taxId?: string;
    businessDescription?: string;
    businessAddress?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
}

const COMPANY_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "sme", label: "Small & Medium Enterprise" },
  { value: "corporation", label: "Corporation" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" }
];

const USER_ROLES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "partner", label: "Partner" },
  { value: "admin", label: "Admin" }
];

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    mobile: "",
    companyName: "",
    companyType: "individual",
    roles: ["buyer"],
    addresses: [],
    billingAddresses: [],
    preferences: { notifications: { email: true, sms: false }, newsletter: true, language: "en", timezone: "UTC" },
    subscription: { currentPlan: 'FREE', autoRenew: true, billingCycle: 'monthly' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createCompanyNow, setCreateCompanyNow] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    website: "",
    gstNumber: "",
    cin: "",
    subscriptionPlan: "single",
    agreedToTerms: false,
    addresses: [
      { line1: "", line2: "", line3: "", country: "", state: "", city: "", zipCode: "", email: "", mobile: "", landline: "", isMailing: false }
    ] as any[]
  });
  // Reference dropdown data (countries/states/cities)
  const [countries, setCountries] = useState<any[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<Record<number, any[]>>({});
  const [citiesByState, setCitiesByState] = useState<Record<number, any[]>>({});
  // Per-address selection ids to fetch cascades
  const [addressMeta, setAddressMeta] = useState<Array<{ countryId?: number; stateId?: number }>>([{ }]);

  const setCompanyField = (field: string, value: any) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
  };

  const setCompanyAddressField = (index: number, field: string, value: any) => {
    setCompanyForm(prev => {
      const list = [ ...(prev.addresses || []) ];
      const updated = { ...(list[index] || {}) } as any;
      updated[field] = value;
      list[index] = updated;
      return { ...prev, addresses: list } as any;
    });
  };

  const addCompanyAddress = () => {
    setCompanyForm(prev => ({
      ...prev,
      addresses: [ ...(prev.addresses || []), { line1: "", line2: "", line3: "", country: "", state: "", city: "", zipCode: "", email: "", mobile: "", landline: "", isMailing: false } ]
    }));
    setAddressMeta(prev => ([ ...prev, {} ]));
  };

  const removeCompanyAddress = (idx: number) => {
    setCompanyForm(prev => {
      const list = [ ...(prev.addresses || []) ];
      list.splice(idx, 1);
      return { ...prev, addresses: list } as any;
    });
    setAddressMeta(prev => {
      const meta = [ ...prev ];
      meta.splice(idx, 1);
      return meta;
    });
  };

  // Load countries when company section opens
  React.useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch('/api/reference/countries?limit=250');
        const js = await res.json();
        if (js?.success) setCountries(js.data || []);
      } catch {}
    };
    if (createCompanyNow && countries.length === 0) loadCountries();
  }, [createCompanyNow]);

  const onSelectCountry = async (addrIdx: number, countryIdStr: string) => {
    const id = parseInt(countryIdStr, 10);
    const country = countries.find(c => c.id === id);
    setAddressMeta(prev => {
      const next = [ ...prev ];
      next[addrIdx] = { countryId: id, stateId: undefined };
      return next;
    });
    setCompanyAddressField(addrIdx, 'country', country?.name || '');
    setCompanyAddressField(addrIdx, 'state', '');
    setCompanyAddressField(addrIdx, 'city', '');
    // fetch states
    try {
      const res = await fetch(`/api/reference/states?countryId=${id}`);
      const js = await res.json();
      if (js?.success) setStatesByCountry(prev => ({ ...prev, [id]: js.data || [] }));
    } catch {}
  };

  const onSelectState = async (addrIdx: number, stateIdStr: string) => {
    const id = parseInt(stateIdStr, 10);
    const meta = addressMeta[addrIdx] || {};
    const states = meta.countryId ? (statesByCountry[meta.countryId] || []) : [];
    const st = states.find((s: any) => s.id === id);
    setAddressMeta(prev => {
      const next = [ ...prev ];
      next[addrIdx] = { ...(next[addrIdx] || {}), stateId: id };
      return next;
    });
    setCompanyAddressField(addrIdx, 'state', st?.name || '');
    setCompanyAddressField(addrIdx, 'city', '');
    // fetch cities
    try {
      const res = await fetch(`/api/reference/cities?stateId=${id}`);
      const js = await res.json();
      if (js?.success) setCitiesByState(prev => ({ ...prev, [id]: js.data || [] }));
    } catch {}
  };

  const onSelectCity = (addrIdx: number, cityIdStr: string) => {
    const id = parseInt(cityIdStr, 10);
    const stId = addressMeta[addrIdx]?.stateId;
    const cities = stId ? (citiesByState[stId] || []) : [];
    const city = cities.find((c: any) => c.id === id);
    setCompanyAddressField(addrIdx, 'city', city?.name || '');
  };

  const handleInputChange = (field: keyof UserFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAddress = (type: 'addresses' | 'billingAddresses') => {
    setFormData(prev => ({
      ...prev,
      [type]: [
        ...((prev as any)[type] || []),
        { firstName: '', lastName: '', email: '', mobile: '', address: '', street: '', city: '', state: '', country: '', zipCode: '', isDefault: (prev as any)[type]?.length ? false : true }
      ]
    }));
  };

  const removeAddress = (type: 'addresses' | 'billingAddresses', index: number) => {
    setFormData(prev => {
      const list = [ ...((prev as any)[type] || []) ];
      list.splice(index, 1);
      // ensure at least one default remains if any items
      if (list.length > 0 && !list.some((a: any) => a.isDefault)) {
        list[0].isDefault = true;
      }
      return { ...prev, [type]: list } as any;
    });
  };

  const setAddressField = (type: 'addresses' | 'billingAddresses', index: number, field: string, value: any) => {
    setFormData(prev => {
      const list = [ ...((prev as any)[type] || []) ];
      const updated = { ...(list[index] || {}) };
      if (field === 'isDefault' && value) {
        list.forEach((a: any, i: number) => { list[i] = { ...a, isDefault: i === index }; });
      }
      updated[field] = value;
      list[index] = updated;
      return { ...prev, [type]: list } as any;
    });
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (!formData.mobile.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return false;
    }
    if (formData.roles.length === 0) {
      setError("At least one role must be selected");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      // If company creation requested, create/update company for this user
      if (createCompanyNow && data?.data?._id) {
        const userId = data.data._id;
        const token2 = localStorage.getItem('accessToken');
        const companyPayload = {
          companyName: companyForm.name || formData.companyName,
          companyType: formData.companyType,
          company: {
            name: companyForm.name || formData.companyName,
            description: companyForm.description || `${formData.companyName} - company description`,
            website: companyForm.website,
            gstNumber: companyForm.gstNumber,
            cin: companyForm.cin,
            subscriptionPlan: companyForm.subscriptionPlan as any,
            agreedToTerms: !!companyForm.agreedToTerms,
            addresses: (companyForm.addresses || []).map(a => ({
              line1: a.line1,
              line2: a.line2 || "",
              line3: a.line3 || "",
              country: a.country,
              state: a.state || "",
              city: a.city || "",
              zipCode: a.zipCode,
              email: a.email || "",
              mobile: a.mobile || "",
              landline: a.landline || "",
              isMailing: !!a.isMailing
            })),
            mailingAddresses: []
          }
        };

        try {
          await fetch(`/api/admin/users/${userId}/company`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token2 ? { Authorization: `Bearer ${token2}` } : {})
            },
            body: JSON.stringify(companyPayload)
          });
        } catch (e) {
          // Non-blocking; proceed to success
          console.error('Company create/update failed:', e);
        }
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccessModal(false);
    router.push('/admin-management/users');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create New User</h1>
        <Link 
          href="/admin-management/users" 
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
        >
          Back to Users
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mobile *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter mobile number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alternate Email</label>
              <input
                type="email"
                value={formData.alternateEmail || ""}
                onChange={(e) => handleInputChange('alternateEmail', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter alternate email (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password (min 8 characters)"
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Type *</label>
              <select
                value={formData.companyType}
                onChange={(e) => handleInputChange('companyType', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {COMPANY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create Company Now toggle */}
          <div className="mt-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" checked={createCompanyNow} onChange={(e) => setCreateCompanyNow(e.target.checked)} />
              Create Company now
            </label>
          </div>

          {createCompanyNow && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <input type="text" value={companyForm.name} onChange={(e) => setCompanyField('name', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input type="url" value={companyForm.website} onChange={(e) => setCompanyField('website', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={companyForm.description} onChange={(e) => setCompanyField('description', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <input type="text" value={companyForm.gstNumber} onChange={(e) => setCompanyField('gstNumber', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CIN</label>
                  <input type="text" value={companyForm.cin} onChange={(e) => setCompanyField('cin', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                  <select value={companyForm.subscriptionPlan} onChange={(e) => setCompanyField('subscriptionPlan', e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="single">Single</option>
                    <option value="multiple">Multiple</option>
                    <option value="decide_later">Decide later</option>
                  </select>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-gray-300" checked={companyForm.agreedToTerms} onChange={(e) => setCompanyField('agreedToTerms', e.target.checked)} />
                Agreed to Terms
              </label>

              {/* Company Addresses */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Company Addresses</h3>
                  <button type="button" onClick={addCompanyAddress} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Add Address</button>
                </div>
                <div className="space-y-4">
                  {(companyForm.addresses || []).map((addr: any, idx: number) => {
                    const meta = addressMeta[idx] || {};
                    const states = meta.countryId ? (statesByCountry[meta.countryId] || []) : [];
                    const cities = meta.stateId ? (citiesByState[meta.stateId] || []) : [];
                    return (
                      <div key={idx} className="border rounded p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input type="text" placeholder="Address line 1" value={addr.line1} onChange={(e) => setCompanyAddressField(idx, 'line1', e.target.value)} className="w-full px-3 py-2 border rounded" />
                          <input type="text" placeholder="Address line 2" value={addr.line2 || ''} onChange={(e) => setCompanyAddressField(idx, 'line2', e.target.value)} className="w-full px-3 py-2 border rounded" />
                          <input type="text" placeholder="Address line 3" value={addr.line3 || ''} onChange={(e) => setCompanyAddressField(idx, 'line3', e.target.value)} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Country</label>
                            <select value={meta.countryId || ''} onChange={(e) => onSelectCountry(idx, e.target.value)} className="w-full px-3 py-2 border rounded">
                              <option value="">Select Country</option>
                              {countries.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">State</label>
                            <select value={meta.stateId || ''} onChange={(e) => onSelectState(idx, e.target.value)} className="w-full px-3 py-2 border rounded" disabled={!meta.countryId}>
                              <option value="">Select State</option>
                              {states.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">City</label>
                            <select value={addr.city ? (cities.find((c:any)=>c.name===addr.city)?.id || '') : ''} onChange={(e) => onSelectCity(idx, e.target.value)} className="w-full px-3 py-2 border rounded" disabled={!meta.stateId}>
                              <option value="">Select City</option>
                              {cities.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <input type="text" placeholder="Zip/Pin" value={addr.zipCode || ''} onChange={(e) => setCompanyAddressField(idx, 'zipCode', e.target.value)} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input type="email" placeholder="Email" value={addr.email || ''} onChange={(e) => setCompanyAddressField(idx, 'email', e.target.value)} className="w-full px-3 py-2 border rounded" />
                          <input type="text" placeholder="Mobile" value={addr.mobile || ''} onChange={(e) => setCompanyAddressField(idx, 'mobile', e.target.value)} className="w-full px-3 py-2 border rounded" />
                          <input type="text" placeholder="Landline" value={addr.landline || ''} onChange={(e) => setCompanyAddressField(idx, 'landline', e.target.value)} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded border-gray-300" checked={!!addr.isMailing} onChange={(e) => setCompanyAddressField(idx, 'isMailing', e.target.checked)} />
                            Mailing Address
                          </label>
                          <button type="button" onClick={() => removeCompanyAddress(idx)} className="text-sm text-red-600 hover:underline">Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Addresses</h2>
            <button type="button" onClick={() => addAddress('addresses')} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Add Address</button>
          </div>
          <div className="space-y-4">
            {(formData.addresses || []).map((addr, idx) => (
              <div key={idx} className="border rounded p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="First Name" value={addr.firstName || ''} onChange={(e) => setAddressField('addresses', idx, 'firstName', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Last Name" value={addr.lastName || ''} onChange={(e) => setAddressField('addresses', idx, 'lastName', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="email" placeholder="Email" value={addr.email || ''} onChange={(e) => setAddressField('addresses', idx, 'email', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="Mobile" value={addr.mobile || ''} onChange={(e) => setAddressField('addresses', idx, 'mobile', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Address" value={addr.address || ''} onChange={(e) => setAddressField('addresses', idx, 'address', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Street" value={addr.street || ''} onChange={(e) => setAddressField('addresses', idx, 'street', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="City" value={addr.city || ''} onChange={(e) => setAddressField('addresses', idx, 'city', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="State" value={addr.state || ''} onChange={(e) => setAddressField('addresses', idx, 'state', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Country" value={addr.country || ''} onChange={(e) => setAddressField('addresses', idx, 'country', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Zip/Pin" value={addr.zipCode || ''} onChange={(e) => setAddressField('addresses', idx, 'zipCode', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!addr.isDefault} onChange={(e) => setAddressField('addresses', idx, 'isDefault', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                    Default Address
                  </label>
                  <button type="button" onClick={() => removeAddress('addresses', idx)} className="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
            {(formData.addresses || []).length === 0 && (
              <div className="text-sm text-gray-500">No addresses added</div>
            )}
          </div>
        </div>

        {/* Billing Addresses */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Billing Addresses</h2>
            <button type="button" onClick={() => addAddress('billingAddresses')} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Add Billing Address</button>
          </div>
          <div className="space-y-4">
            {(formData.billingAddresses || []).map((addr, idx) => (
              <div key={idx} className="border rounded p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="First Name" value={addr.firstName || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'firstName', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Last Name" value={addr.lastName || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'lastName', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="email" placeholder="Email" value={addr.email || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'email', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="Mobile" value={addr.mobile || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'mobile', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Address" value={addr.address || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'address', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Street" value={addr.street || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'street', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="City" value={addr.city || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'city', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="State" value={addr.state || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'state', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Country" value={addr.country || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'country', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <input type="text" placeholder="Zip/Pin" value={addr.zipCode || ''} onChange={(e) => setAddressField('billingAddresses', idx, 'zipCode', e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!addr.isDefault} onChange={(e) => setAddressField('billingAddresses', idx, 'isDefault', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                    Default Billing Address
                  </label>
                  <button type="button" onClick={() => removeAddress('billingAddresses', idx)} className="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
            {(formData.billingAddresses || []).length === 0 && (
              <div className="text-sm text-gray-500">No billing addresses added</div>
            )}
          </div>
        </div>

        {/* Roles */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">User Roles *</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {USER_ROLES.map(role => (
              <label key={role.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.roles.includes(role.value)}
                  onChange={() => handleRoleToggle(role.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{role.label}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Select at least one role for the user
          </p>
        </div>

        {/* Bio */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter user bio (optional)"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Notifications</label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!formData.preferences?.notifications?.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: { ...prev.preferences?.notifications, email: e.target.checked }
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!formData.preferences?.notifications?.sms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: { ...prev.preferences?.notifications, sms: e.target.checked }
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>SMS</span>
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Newsletter</label>
                <input
                  type="checkbox"
                  checked={!!formData.preferences?.newsletter}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, newsletter: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <input
                  type="text"
                  value={formData.preferences?.language || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <input
                  type="text"
                  value={formData.preferences?.timezone || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, timezone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Plan</label>
              <select
                value={formData.subscription?.currentPlan || 'FREE'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  subscription: { ...prev.subscription, currentPlan: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="FREE">FREE</option>
                <option value="GOLD">GOLD</option>
                <option value="PLATINUM">PLATINUM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Billing Cycle</label>
              <select
                value={formData.subscription?.billingCycle || 'monthly'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  subscription: { ...prev.subscription, billingCycle: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!formData.subscription?.autoRenew}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    subscription: { ...prev.subscription, autoRenew: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Auto Renew</span>
              </label>
            </div>
          </div>
        </div>

        {/* Seller Profile (basic) */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Seller Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business License</label>
              <input
                type="text"
                value={formData.sellerProfile?.businessLicense || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sellerProfile: { ...prev.sellerProfile, businessLicense: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax ID</label>
              <input
                type="text"
                value={formData.sellerProfile?.taxId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sellerProfile: { ...prev.sellerProfile, taxId: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Business Description</label>
              <textarea
                value={formData.sellerProfile?.businessDescription || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sellerProfile: { ...prev.sellerProfile, businessDescription: e.target.value }
                }))}
                rows={3}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin-management/users"
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            User Created Successfully!
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            The new user has been created and can now access the system.
          </p>
          <button
            onClick={handleSuccess}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </Modal>
    </div>
  );
}
