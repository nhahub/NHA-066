from dotenv import load_dotenv
import os
import time
from twelvelabs import TwelveLabs

class ReporterAPI:
    def __init__(self):
        load_dotenv()
        token = os.getenv("TWELEVE_LABS_TOKEN")
        if not token:
            raise ValueError("❌ Missing TWELEVE_LABS_TOKEN in .env")

        self.client = TwelveLabs(api_key=token)
        self.index_id = "692b671dd7a0bf13a3b4e09e"

    def summary(self, file_path: str) -> str:
        """
        Uploads a video, indexes it, waits until it's ready,
        then generates and returns a summary.
        """

        # 1. Upload
        asset = self.client.assets.create(
            method="direct",
            file=open(file_path, "rb"),
        )

        print(f"Uploaded Asset ID: {asset.id}")

        # 2. Index
        indexed_asset = self.client.indexes.indexed_assets.create(
            index_id=self.index_id,
            asset_id=asset.id,
            enable_video_stream=False,
        )

        print(f"Indexing request sent. Indexed Asset ID: {indexed_asset.id}")

        # 3. Wait until ready
        while True:
            try:
                result = self.client.summarize(
                    video_id=indexed_asset.id,
                    type="summary",
                    prompt="Summarize this video",
                    temperature=0.3
                )
                break
            except Exception as e:
                if hasattr(e, "body") and e.body.get("code") == "video_not_ready":
                    print(".")
                    time.sleep(1)
                else:
                    print("TwelveLabs API Error:", e)
                    return None

        # 4. Return summary
        return result.summary
