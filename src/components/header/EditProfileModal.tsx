"use client";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/modal";
import InputField from "../form/input/InputField";
import Button from "../ui/button/Button";
import Image from "next/image";
import NameInitialsAvatar from "../ui/avatar/NameInitialsAvatar";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
  };
  onProfileUpdate?: (updatedUser: { firstName: string; lastName: string; email: string; profilePhoto?: string }) => void;
}

export default function EditProfileModal({ isOpen, onClose, currentUser, onProfileUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePhoto: "",
  });
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        profilePhoto: currentUser.profilePhoto || "",
      });
      setPreviewPhoto(null);
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please select a valid image file (JPEG, PNG, or WebP)" });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 2MB" });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Automatically upload the photo
    await handlePhotoUpload(file);
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setLoading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/admin/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Profile photo uploaded successfully!" });
        // Update the formData with the new photo URL
        setFormData(prev => ({ ...prev, profilePhoto: data.data.profilePhoto }));
        // Update the current user's profile photo
        if (onProfileUpdate && currentUser) {
          onProfileUpdate({
            ...currentUser,
            profilePhoto: data.data.profilePhoto
          });
        }
      } else {
        setMessage({ type: "error", text: data.message || "Failed to upload photo" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while uploading photo" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/profile/photo', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Profile photo removed successfully!" });
        setPreviewPhoto(null);
        setFormData(prev => ({ ...prev, profilePhoto: "" }));
        // Update the current user's profile photo
        if (onProfileUpdate && currentUser) {
          onProfileUpdate({
            ...currentUser,
            profilePhoto: ""
          });
        }
      } else {
        setMessage({ type: "error", text: data.message || "Failed to remove photo" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while removing photo" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          profilePhoto: formData.profilePhoto,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        if (onProfileUpdate) {
          onProfileUpdate({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            profilePhoto: formData.profilePhoto,
          });
        }
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while updating profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo Section */}
          <div className="text-center">
            <div className="mb-4">
              {previewPhoto || currentUser?.profilePhoto ? (
                <div className="relative inline-block">
                  <Image
                    src={previewPhoto || currentUser?.profilePhoto || ""}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full object-cover mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPhoto(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    title="Remove preview"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <NameInitialsAvatar
                  firstName={currentUser?.firstName || ""}
                  lastName={currentUser?.lastName || ""}
                  size="xl"
                  className="mx-auto"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer text-sm"
              >
                {loading ? "Uploading..." : "Change Photo"}
              </label>
              
              {(previewPhoto || currentUser?.profilePhoto) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="block mx-auto px-3 py-1 text-red-600 hover:text-red-700 text-sm"
                  disabled={loading}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <InputField
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <InputField
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <InputField
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded text-sm ${
              message.type === "success" 
                ? "bg-green-100 text-green-700 border border-green-300" 
                : "bg-red-100 text-red-700 border border-red-300"
            }`}>
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
