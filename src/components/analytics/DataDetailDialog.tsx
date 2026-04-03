'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface DataDetailDialogProps<TData> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    columns: ColumnDef<TData, any>[];
    data: TData[];
    filterColumn: string;
    filterPlaceholder: string;
}

export function DataDetailDialog<TData>({
    isOpen,
    onClose,
    title,
    description,
    columns,
    data,
    filterColumn,
    filterPlaceholder
}: DataDetailDialogProps<TData>) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-3xl border-black/10 dark:border-white/20 text-foreground dark:text-white rounded-[2.5rem] shadow-[0_0_80px_rgba(var(--primary-rgb),0.15)] ring-1 ring-black/5 dark:ring-white/5">
                <DialogHeader className="pb-6 border-b border-black/5 dark:border-white/5">
                    <DialogTitle className="text-3xl font-black italic tracking-tighter text-primary">{title}</DialogTitle>
                    <DialogDescription className="text-foreground/60 dark:text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-8">
                    <div className="rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]">
                        <DataTable 
                            columns={columns} 
                            data={data} 
                            filterColumn={filterColumn} 
                            filterPlaceholder={filterPlaceholder} 
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

