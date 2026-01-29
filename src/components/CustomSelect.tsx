import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    description?: string;
}

interface CustomSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
}

export default function CustomSelect({ label, value, onChange, options }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (tooltip) setTooltip(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true); // Capture scroll events to hide tooltip

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [tooltip]);

    const handleMouseEnter = (e: React.MouseEvent, description: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Position to the right of the icon, with some offset
        // Check if it fits on screen, otherwise flip (simplified: just right or slightly left if too close to edge)
        // For simplicity, default to right-aligned or centered above/below if preferred.
        // User requested "above the mini window", so essentially just visible.
        // Let's position it to the left of the icon if it's too far right, or default to left-aligned popup.

        // Actually, "above the mini window" means visible on top of it.
        // Let's create a "floating" style near the mouse/icon.

        setTooltip({
            text: description,
            x: rect.left - 200, // Show to the left of the icon (since dropdown is usually left-aligned, icon is on right)
            y: rect.top - 10
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="mb-2 block text-sm font-medium">{label}</label>
            <button
                type="button"
                className={`flex w-full items-center justify-between rounded-lg border bg-background px-3 py-3 text-sm transition-colors ${isOpen ? 'border-foreground ring-2 ring-ring/20' : 'border-border hover:border-foreground/30'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption?.label || 'Select option'}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover shadow-md animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`group relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${option.value === value
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-popover-foreground hover:bg-secondary'
                                    }`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                <span>{option.label}</span>
                                {option.description && (
                                    <div
                                        className="ml-2 cursor-help p-1"
                                        onMouseEnter={(e) => handleMouseEnter(e, option.description!)}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fixed Tooltip Portal */}
            {tooltip && (
                <div
                    className="fixed z-[100] w-64 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                    style={{
                        top: tooltip.y,
                        // Align right edge of tooltip with the icon's position (x)
                        left: tooltip.x,
                        // Adjust if we want it centered or to the side. 
                        // Current logic: x is rect.left - 200. So the tooltip starts 200px to the left of the icon.
                        // Better calculation: 
                        // left: tooltip.x
                    }}
                >
                    {tooltip.text}
                    {/* Small arrow pointing to right (towards icon) */}
                    <div className="absolute top-4 right-[-4px] h-3 w-3 rotate-45 bg-foreground" />
                </div>
            )}
        </div>
    );
}
