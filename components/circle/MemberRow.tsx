import { Badge } from '@/components/ui/badge';
import { AddressChip } from '@/components/wallet/AddressChip';
import { formatUSDC } from '@/lib/utils';

interface Props {
    address: string;
    contributed: boolean;
    onTime: boolean;
    amount?: bigint;
    isRecipient: boolean;
    isOrganizer?: boolean;
    position: number;
}

export function MemberRow({ address, contributed, onTime, amount, isRecipient, isOrganizer, position }: Props) {
    function statusBadge() {
        if (!contributed) return <Badge variant="muted">Pending</Badge>;
        if (!onTime) return <Badge variant="warning">Late</Badge>;
        return <Badge variant="success">On time</Badge>;
    }

    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-(--border-subtle) last:border-0">
            <span className="font-mono text-xs text-(--text-muted) w-5 text-right">{position}</span>
            <AddressChip address={address} />
            <div className="flex flex-1 items-center justify-end gap-2">
                {isRecipient && <Badge variant="gold">Recipient</Badge>}
                {isOrganizer && <Badge variant="forest">Organizer</Badge>}
                {contributed && amount && (
                    <span className="font-mono text-sm text-(--text-secondary)">
                        {formatUSDC(amount)}
                    </span>
                )}
                {statusBadge()}
            </div>
        </div>
    );
}
