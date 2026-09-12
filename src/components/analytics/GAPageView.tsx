"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export default function GAPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!window.gtag) return;

        const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        window.gtag('event', 'page_view', {
            page_path: url,
            page_location: window.location.href,
        });
    }, [pathname, searchParams]);

    return null;
}