<script>
    import DataAccuracyCard from "../Cards/DataAccuracyCard.svelte";
    import DataCycleTimeCard from "../Cards/DataCycleTimeCard.svelte";
    import DataHeatMapCard from "../Cards/DataHeatMapCard.svelte";
    import DataLeaderboardCard from "../Cards/DataLeaderboardCard.svelte";

    let teamNumber = "10000";

    let leaderboardTeams = [
        "PLACEHOLDER0", 
        "PLACEHOLDER1", 
        "PLACEHOLDER2", 
        "PLACEHOLDER3", 
        "PLACEHOLDER4", 
        "PLACEHOLDER5", 
        "PLACEHOLDER6", 
        "PLACEHOLDER7", 
        "PLACEHOLDER8", 
        "PLACEHOLDER9", 
    ];
</script>

<!-- Divides space into 3 equal width columns -->
<div class="py-8 px-8 grid grid-cols-3 gap-4 min-h-screen">
    <!-- Section that takes up 2 of the columns to the left - team info section -->
    <div class="col-span-2 flex flex-col h-full">
        <!-- Team Number Card - Very small, no need for seperate component -->
        <div
            class="w-[300px] h-[70px] mb-4 bg-primary rounded-3xl border-2
    border-accent shadow-lg p-8 flex flex-col items-start
    justify-center relative flex-shrink-0"
        >
            <p class="text-text text-3xl font-medium">Team: {teamNumber}</p>
        </div>

        <!-- Container for dynamically sized cards-->
        <!-- Takes remaining space at bottom -->
        <div class="flex-1 flex flex-col gap-4 min-h-0">
            <!-- Top row with two side-by-side cards -->
            <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <DataAccuracyCard/>
                <DataCycleTimeCard/>
            </div>

            <!-- Bottom card -->
            <DataHeatMapCard/>
        </div>
    </div>
    <DataLeaderboardCard/>
</div>
