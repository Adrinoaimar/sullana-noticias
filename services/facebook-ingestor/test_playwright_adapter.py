import importlib.util
import pathlib
import unittest


MODULE_PATH = pathlib.Path(__file__).with_name("playwright_adapter.py")
SPEC = importlib.util.spec_from_file_location("playwright_adapter_under_test", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class PlaywrightTextExtractionTests(unittest.TestCase):
    def test_feed_text_drops_inline_player_error(self):
        lines = [
            "14m",
            "[AVISO] Se vienen los talleres productivos Sorry, we're having trouble playing this video.",
            "Learn more",
            "Like",
            "Comment",
            "Share",
        ]
        text = MODULE.PlaywrightFacebookSourceAdapter._text_from_lines(lines, 0, "El Chilalo Noticias")
        self.assertEqual(text, "[AVISO] Se vienen los talleres productivos")

    def test_video_text_stops_before_related_content(self):
        lines = [
            "0:29 / 1:00",
            "#Sullana",
            "Texto principal de la publicación pública.",
            "Like",
            "Comment",
            "Share",
            "Related videos",
            "0:20",
            "Texto de otra publicación sugerida.",
        ]
        text = MODULE.PlaywrightFacebookSourceAdapter._video_text(lines)
        self.assertEqual(text, "#Sullana\nTexto principal de la publicación pública.")


if __name__ == "__main__":
    unittest.main()
