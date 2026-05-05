import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import Image from 'next/image';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MeetingModelprops {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    title: string;
    className?: string;
    children?: React.ReactNode;
    handleClick?: () => void;
    buttonText?: string;
    image?: string;
    buttonIcon: string;
}

const MeetingModal = ({ isOpen, onClose, title, className, children, handleClick, buttonText, image, buttonIcon }: MeetingModelprops) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='flex w-full max-w-[520px] flex-col gap-5
                bg-white border border-indigo-100/60
                shadow-[0_25px_60px_rgba(99,102,241,0.15)]
                rounded-3xl px-7 py-8'>

                <DialogTitle className="sr-only">{title}</DialogTitle>

                <div className='flex flex-col gap-5'>
                    {/* Optional illustration */}
                    {image && (
                        <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50
                                border border-indigo-100 flex items-center justify-center shadow-sm">
                                <Image src={image} alt="modal illustration" width={48} height={48} />
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <h1 className={cn(
                            'text-2xl font-bold leading-tight',
                            'bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent',
                            className
                        )}>
                            {title}
                        </h1>
                        <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                    </div>

                    {/* Children (form content) */}
                    {children}

                    {/* CTA Button */}
                    <Button
                        className='bg-gradient-to-r from-indigo-500 to-violet-600
                            hover:from-indigo-600 hover:to-violet-700
                            text-white rounded-xl h-12 font-semibold
                            shadow-sm hover:shadow-glow-indigo
                            transition-all duration-200
                            focus-visible:ring-0 focus-visible:ring-offset-0
                            gap-2 active:scale-[0.97]'
                        onClick={handleClick}
                    >
                        {buttonIcon && (
                            <Image src={buttonIcon} alt="button icon" width={16} height={16} />
                        )}
                        {buttonText || 'Schedule Meeting'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default MeetingModal
