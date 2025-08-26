<script>
    import { construct_svelte_component } from "svelte/internal";

    let progress = 80;

    //placeholder
    function testGET() {
        fetch("http://localhost:5000/api/test")
            .then((response) => response.json())
            .then((data) => console.log(data))
            .catch((error) => console.error("Error:", error));
    }
</script>

<div class="grid grid-rows-[1fr_60px] gap-4 h-full">
    <div
        class="flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8
                flex flex-col items-start justify-start relative min-h-0"
    >
        <img
            src="static/images/field.png"
            alt="field"
            class="w-full h-full object-contain"
        />
    </div>
    <div
        class="flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-4
                flex flex-col items-start justify-center relative"
    >
        <div
            class="grid grid-cols-[60px_1fr] gap-4 w-full justify-center items-center"
        >
            <button
                class="flex items-center text-text text-3xl font-small z-50"
                on:click={testGET}>Play</button
            >
            <div class="w-full bg-gray-500 rounded-full h-4">
                <div
                    class="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style="width: {progress}%"
                ></div>
            </div>
        </div>
    </div>
</div>
