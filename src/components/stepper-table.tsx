import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StepperDefinition } from '@/lib/stepper.ts';
import { useMemo, useState } from 'react';

export const columns: ColumnDef<StepperDefinition>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: 'brand',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Brand
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div className="capitalize">{row.getValue('brand')}</div>
	},
	{
		accessorKey: 'model',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Model
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('model')}</div>
	},
	{
		accessorKey: 'nemaSize',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					NEMA Size
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>NEMA {row.getValue('nemaSize')}</div>
	},
	{
		accessorKey: 'bodyLength',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Body Length
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('bodyLength')} mm</div>
	},
	{
		accessorKey: 'ratedCurrent',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Rated Current
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('ratedCurrent')} A</div>
	},
	{
		accessorKey: 'torque',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Holding Torque
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('torque')} Ncm</div>
	},
	{
		accessorKey: 'inductance',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Inductance
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('inductance')} mH</div>
	},
	{
		accessorKey: 'resistance',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Resistance
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('resistance')} Ω</div>
	},
	{
		accessorKey: 'rotorInertia',
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Rotor Inertia
					<ArrowUpDown />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue('rotorInertia')} gcm²</div>
	},
	{
		accessorKey: 'comments',
		header: () => <div>Comments</div>,
		cell: ({ row }) => (
			<ul>
				{(row.getValue('comments') as string[]).map((comment, i) => (
					<li className="list-disc list-inside" key={i}>
						{comment}
					</li>
				))}
			</ul>
		)
	}
];

export function StepperTable({ steppers }: { steppers: Map<string, Map<string, StepperDefinition>> }) {
	const data = useMemo(
		() => Array.from(steppers.values()).flatMap((steppers) => Array.from(steppers.values())),
		[steppers]
	);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [rowSelection, setRowSelection] = useState({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: data.length
	});

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		state: {
			sorting,
			columnFilters,
			rowSelection,
			pagination
		}
	});

	return (
		<div className="overflow-auto rounded-md border min-h-px flex-1 w-full">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
