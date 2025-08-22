import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/utils/formatters";
import connectToDatabase from "@/lib/db";
const getUserModel = async () => (await import("@/models/userModel")).default;
import { Metadata } from "next";
import type { Types } from "mongoose";

export const metadata: Metadata = {
  title: "Users | TailAdmin - Next.js Dashboard Template",
  description: "Users list fetched from MongoDB",
};

type SerializableUser = { id: string; name: string; email: string; createdAt: string };

export default async function UsersPage() {
  let users: SerializableUser[] = [];
  if (process.env.MONGODB_URI) {
    await connectToDatabase();
    const User = await getUserModel();
    const mongoUsers: Array<{ _id: Types.ObjectId; name: string; email: string; createdAt?: Date }> =
      await User.find({}, { name: 1, email: 1, createdAt: 1 }).lean();

    users = mongoUsers.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      createdAt: (u.createdAt ?? new Date()).toISOString(),
    }));
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-6">
        <ComponentCard title="All Users">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-start">No users yet</TableCell>
                        <TableCell className="px-5 py-4">&nbsp;</TableCell>
                        <TableCell className="px-5 py-4">&nbsp;</TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="px-5 py-4 text-start">{u.name}</TableCell>
                          <TableCell className="px-5 py-4 text-start">{u.email}</TableCell>
                          <TableCell className="px-5 py-4 text-start">{formatDateTime(u.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}


