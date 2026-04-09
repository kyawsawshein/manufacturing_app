import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { getRequestRMRecords } from "../app/actions";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function RequestRMPage() {
    const records = await getRequestRMRecords();

    return (
        <DashboardLayout>
            <main className="min-h-screen bg-muted/30 py-8">
                <div className="max-w-[1400px] mx-auto px-4 w-full space-y-6">
                    <header className="mb-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Request RM Records</h1>
                                <p className="mt-2 text-muted-foreground">
                                    Review current Request RM records and create new raw material requests.
                                </p>
                            </div>
                            <Link href="/manufacturing/request-rm/create">
                                <Button>Create Request RM</Button>
                            </Link>
                        </div>
                    </header>

                    <Card>
                        <CardHeader>
                            <CardTitle>Request RM Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="p-2 text-left">Date</th>
                                            <th className="p-2 text-left">Time</th>
                                            <th className="p-2 text-left">Status</th>
                                            <th className="p-2 text-left">Employee</th>
                                            <th className="p-2 text-left">MO No</th>
                                            <th className="p-2 text-left">Items</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                    No Request RM records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            records.map((record) => (
                                                <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="p-2">{record.date || "-"}</td>
                                                    <td className="p-2">{record.time || "-"}</td>
                                                    <td className="p-2">{record.status || "-"}</td>
                                                    <td className="p-2">{record.employeeName || "-"}</td>
                                                    <td className="p-2">{record.moRef || "-"}</td>
                                                    <td className="p-2">{record.itemsCount}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
