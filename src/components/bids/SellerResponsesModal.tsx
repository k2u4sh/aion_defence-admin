"use client";

import React from "react";
import { XIcon, UserIcon, MessageIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

interface SellerResponse {
  _id: string;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  respondedAt: string;
  quotedPrice?: number;
  estimatedDelivery?: string;
  notes?: string;
  attachments: Array<{
    url: string;
    originalName: string;
    fileType: string;
    fileSize: number;
  }>;
}

interface SellerResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerResponses: SellerResponse[];
  bidName: string;
}

const SellerResponsesModal = ({ isOpen, onClose, sellerResponses, bidName }: SellerResponsesModalProps) => {
  if (!isOpen) return null;

  console.log("SellerResponsesModal - sellerResponses:", sellerResponses);
  console.log("SellerResponsesModal - bidName:", bidName);
  console.log("SellerResponsesModal - sellerResponses length:", sellerResponses?.length);

  const getSellerStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "warning" as const, label: "Pending" },
      accepted: { color: "success" as const, label: "Accepted" },
      rejected: { color: "error" as const, label: "Rejected" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Seller Responses
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {bidName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-4 sm:p-6">
            <div className="mb-4 p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Debug: Modal is open. Seller responses count: {sellerResponses?.length || 0}
              </p>
            </div>
            {sellerResponses && sellerResponses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quoted Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Comments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Attachments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Responded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sellerResponses.map((response) => (
                      <tr key={response._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* Seller */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {response.seller?.firstName || 'Unknown'} {response.seller?.lastName || 'Seller'}
                              </div>
                              {response.seller?.companyName && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {response.seller.companyName}
                                </div>
                              )}
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {response.seller?.email || 'No email available'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSellerStatusBadge(response.status)}
                        </td>

                        {/* Quoted Price */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {response.quotedPrice ? (
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              ${response.quotedPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Not provided</span>
                          )}
                        </td>

                        {/* Delivery */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {response.estimatedDelivery || (
                            <span className="text-gray-500 dark:text-gray-400">Not provided</span>
                          )}
                        </td>

                        {/* Comments */}
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="max-w-xs">
                            {response.notes ? (
                              <div className="line-clamp-3">{response.notes}</div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">No comments</span>
                            )}
                          </div>
                        </td>

                        {/* Attachments */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {response.attachments && response.attachments.length > 0 ? (
                            <div className="space-y-1">
                              {response.attachments.slice(0, 2).map((attachment, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-xs truncate max-w-20" title={attachment.originalName}>
                                    {attachment.originalName}
                                  </span>
                                </div>
                              ))}
                              {response.attachments.length > 2 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  +{response.attachments.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">None</span>
                          )}
                        </td>

                        {/* Responded At */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(response.respondedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <MessageIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No seller responses</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No sellers have responded to this bid yet.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerResponsesModal;
