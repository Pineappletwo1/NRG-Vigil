<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script>
    let files = [];

    function handleFiles(selectedFiles) {
        files = Array.from(selectedFiles);
        files.forEach((file) => console.log(file.name)); //TODO: Change so it serves files to model
    }

    function handleDroppedLink(link) {
        console.log(link); //TODO: Change so it downloads yt video
    }

    function onDrop(event) {
        event.preventDefault();

        const dt = event.dataTransfer;

        if (dt.files && dt.files.length > 0) {
            handleFiles(dt.files);
        } else {
            const text = dt.getData("text/plain");
            if (text) {
                handleDroppedLink(text);
            }
        }
    }

    function onDragOver(event) {
        event.preventDefault();
    }

    function onPaste(event) {
        const pastedText = event.clipboardData.getData("text");
        if (pastedText) {
            console.log(pastedText);
        }
    }

    let fileInput;
    function openFileDialog() {
        fileInput.click();
    }

    function onInputChange(event) {
        handleFiles(event.target.files);
    }
</script>

<div
    class="flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8 min-h-[60vh] flex flex-col items-center justify-center relative cursor-pointer"
    on:click={openFileDialog}
    on:drop={onDrop}
    on:dragover={onDragOver}
    on:paste={onPaste}
    tabindex="0"
    role="button"
>
    <input
        type="file"
        multiple
        bind:this={fileInput}
        class="hidden"
        on:change={onInputChange}
    />

    <img
        src="static/images/upload.png"
        alt="upload"
        class="w-64 h-64 object-contain mb-8 mt-[-2rem]"
    />
    <p class="text-text text-3xl font-medium mb-4">Drag or click files</p>
</div>
