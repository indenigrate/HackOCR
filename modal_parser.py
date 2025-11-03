# modal_parser.py

import modal
import subprocess

# Define model constants
MODEL_NAME = "microsoft/Phi-3-mini-4k-instruct"
SERVED_MODEL_NAME = "phi3-mini"

# Define base image and dependencies
vllm_image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.1-devel-ubuntu22.04",
        add_python="3.10",
    )
    .pip_install(
        "torch>=2.1.0",
        "transformers",
        # "vllm>=0.5.4",           # ✅ newer than 0.5.1
        # "vllm>=0.7.0",
        "vllm>=0.10.0",
        # "xgrammar>=0.2.0",
        # "git+https://github.com/vllm-project/xgrammar.git@main",
        "lm-format-enforcer>=0.9.8",
        "outlines>=0.0.46",      # ✅ matches vllm >=0.5.4
        "huggingface_hub",
        "hf-transfer",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)

app = modal.App("phi3-llm-server")

# Persistent caches for faster loading
hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)

N_GPU = 1
MINUTES = 60
VLLM_PORT = 8000

@app.function(
    image=vllm_image,
    gpu=f"A10G:{N_GPU}",
    scaledown_window=2 * MINUTES,
    timeout=20 * MINUTES,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
)
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve():
    cmd = [
        "python", "-m", "vllm.entrypoints.openai.api_server",
        "--model", MODEL_NAME,
        "--served-model-name", SERVED_MODEL_NAME,
        "--host", "0.0.0.0",
        "--port", str(VLLM_PORT),
        "--trust-remote-code",
        "--tensor-parallel-size", str(N_GPU),
    ]
    print(f"Starting vLLM server with command: {' '.join(cmd)}")
    subprocess.Popen(" ".join(cmd), shell=True)
