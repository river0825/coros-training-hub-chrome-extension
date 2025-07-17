interface CorosActivity {
    date: string;
    sportType: number;
    sport: string;
    distance: number;
    time: string | number;
}
declare global {
    interface Window {
        corosActivities: CorosActivity[];
        $?: typeof jQuery;
    }
}
export {};
//# sourceMappingURL=content.d.ts.map