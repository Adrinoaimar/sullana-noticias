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

    def test_feed_text_stops_at_next_source_metadata(self):
        lines = [
            "13h",
            "Texto principal de la publicación pública.",
            "El Chilalo Noticias",
            "102 views",
            "19m ago",
            "0:29",
            "Texto de otro video relacionado.",
        ]
        text = MODULE.PlaywrightFacebookSourceAdapter._text_from_lines(lines, 0, "El Chilalo Noticias")
        self.assertEqual(text, "Texto principal de la publicación pública.")

    def test_video_text_stops_at_next_source_metadata(self):
        lines = [
            "#Sullana",
            "Texto principal del video.",
            "El Chilalo Noticias",
            "102 views",
            "19m ago",
            "0:29",
            "Texto de otro video relacionado.",
        ]
        text = MODULE.PlaywrightFacebookSourceAdapter._video_text(lines, "El Chilalo Noticias")
        self.assertEqual(text, "#Sullana\nTexto principal del video.")

    def test_relative_labels_are_recognized_for_same_visible_caption(self):
        self.assertTrue(MODULE._is_relative_date_label("6m"))
        self.assertTrue(MODULE._is_relative_date_label("7m"))
        self.assertFalse(MODULE._is_relative_date_label("June 24, 2022"))

    def test_video_caption_must_match_descriptive_public_url(self):
        unrelated = "[AVISO] Se vienen los talleres productivos para las mujeres."
        whale_url = "https://www.facebook.com/ElChilaloNoticias/videos/pescador-se-lanza-al-mar-para-salvar-a-una-ballena/1393457035560823"
        matching = "Pescador se lanza al mar para salvar a una ballena."
        self.assertFalse(MODULE.PlaywrightFacebookSourceAdapter._video_caption_matches_url(whale_url, unrelated))
        self.assertTrue(MODULE.PlaywrightFacebookSourceAdapter._video_caption_matches_url(whale_url, matching))


if __name__ == "__main__":
    unittest.main()
