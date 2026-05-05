import { useState, useEffect } from "react"

export const useGetCalls = () => {
    const [upcomingCalls, setUpcomingCalls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/meetings');
                if (res.ok) {
                    const data = await res.json();
                    // Filter for only upcoming calls
                    const now = new Date();
                    const upcoming = data.filter((call: any) => new Date(call.dateTime) > now);
                    setUpcomingCalls(upcoming);
                }
            } catch (error) {
                console.error("Failed to fetch meetings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCalls();
    }, []);

    // Other calls not supported yet in pure WebRTC migration
    return {
        endedCalls: [],
        upcomingCalls,
        callrecordings: [],
        isLoading,
    }
}