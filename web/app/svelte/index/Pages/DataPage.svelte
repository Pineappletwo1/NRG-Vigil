<script>
    let teamNumber = "10000";

    let leaderboardTeams = [1, 2, 3, 4, 1000, 200, 513, 8645, 948, 9994];
</script>

<div class="grid grid-cols-3 gap-4 h-[calc(100vh-5rem)]">
    <div class="col-span-2 flex flex-col h-full">
        <!-- Team Number Block - Fixed height -->
        <div
            class="w-[300px] h-[70px] mx-8 mt-8 mb-4 bg-primary rounded-3xl border-2
    border-accent shadow-lg p-8 flex flex-col items-start
    justify-center relative flex-shrink-0"
        >
            <p class="text-text text-3xl font-medium">Team: {teamNumber}</p>
        </div>

        <!-- Container for stretchy blocks - Takes remaining space -->
        <div class="flex-1 flex flex-col mx-8 mb-8 gap-4 min-h-0">
            <!-- Top row with two equal blocks -->
            <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div
                    class="bg-primary rounded-3xl border-2 border-accent shadow-lg p-8
                    flex flex-col items-start justify-center relative"
                ></div>
                <div
                    class="bg-primary rounded-3xl border-2 border-accent shadow-lg p-8
                    flex flex-col items-start justify-center relative"
                ></div>
            </div>

            <!-- Bottom block - Same height as top row -->
            <div
                class="flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8
                flex flex-col items-start justify-center relative min-h-0"
            ></div>
        </div>
    </div>
</div>
