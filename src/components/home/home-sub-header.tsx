'use client';

import React from 'react';
import HomeBoardSelector, { HomeBoardType } from './home-board-selector';
import { LocationSelector } from './location-selector';
import { cn } from '@/lib/utils';
import { usePlatform } from '@/hooks/use-platform';

interface HomeSubHeaderProps {
    activeBoard: HomeBoardType;
    onChange: (board: HomeBoardType) => void;
    isStudent?: boolean;
}

export function HomeSubHeader({ activeBoard, onChange, isStudent }: HomeSubHeaderProps) {
    const { isMobile } = usePlatform();

    return (
        <div className="fixed top-[75px] left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
            <div className="flex items-center gap-3 w-full max-w-5xl justify-center pointer-events-auto">
                {/* Round Location Pin Circle */}
                {activeBoard === 'delivery' && (
                    <div className="shrink-0 animate-in fade-in zoom-in slide-in-from-left-4 duration-500">
                        <LocationSelector variant="roundPrimary" />
                    </div>
                )}

                {/* Capsule Module Selector */}
                <div className="flex-1 max-w-[400px]">
                    <HomeBoardSelector 
                        activeBoard={activeBoard} 
                        onChange={onChange} 
                        isStudent={isStudent} 
                        isEmbedded={true}
                    />
                </div>
            </div>
        </div>
    );
}
