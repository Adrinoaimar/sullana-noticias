import importlib.util
import pathlib
import unittest


MODULE_PATH = pathlib.Path(__file__).with_name("playwright_adapter.py")
SPEC = importlib.util.spec_from_file_location("playwright_adapter_under_test", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class PlaywrightTextExtractionTests(unittest.TestCase):
    def test_caption_expansion_is_scoped_to_feed_articles(self):
        clicked = []

        class Button:
            def count(self):
                return 1

            def nth(self, _index):
                return self

            def is_visible(self):
                return True

            def scroll_into_view_if_needed(self, **_kwargs):
                return None

            def click(self, **_kwargs):
                clicked.append(True)

        class Article:
            def get_by_role(self, *_args, **_kwargs):
                return Button()

            def get_by_text(self, *_args, **_kwargs):
                return Button()

        class Articles:
            def count(self):
                return 1

            def nth(self, _index):
                return Article()

        class Page:
            def locator(self, selector):
                self.selector = selector
                return Articles()

            def wait_for_timeout(self, _milliseconds):
                return None

        adapter = MODULE.PlaywrightFacebookSourceAdapter.__new__(MODULE.PlaywrightFacebookSourceAdapter)
        self.assertEqual(adapter._expand_page_captions(Page()), 1)
        self.assertEqual(clicked, [True])

    def test_caption_expansion_falls_back_to_scoped_dom_click(self):
        dispatched = []

        class Button:
            def count(self):
                return 1

            def nth(self, _index):
                return self

            def is_visible(self):
                return True

            def scroll_into_view_if_needed(self, **_kwargs):
                return None

            def click(self, **_kwargs):
                raise RuntimeError("Facebook feed layer moved")

            def dispatch_event(self, event_name, **_kwargs):
                dispatched.append(event_name)

        class Article:
            def get_by_role(self, *_args, **_kwargs):
                return Button()

            def get_by_text(self, *_args, **_kwargs):
                return Button()

        class Articles:
            def count(self):
                return 1

            def nth(self, _index):
                return Article()

        class Page:
            def locator(self, selector):
                self.selector = selector
                return Articles()

            def wait_for_timeout(self, _milliseconds):
                return None

        adapter = MODULE.PlaywrightFacebookSourceAdapter.__new__(MODULE.PlaywrightFacebookSourceAdapter)
        self.assertEqual(adapter._expand_page_captions(Page()), 1)
        self.assertEqual(dispatched, ["click"])

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

    def test_feed_text_stops_before_page_chrome(self):
        lines = [
            "1h",
            "Page · Government organization Plaza Miguel Grau S/N - Marcavelica",
            "munimarcavelica@munimarcavelica.gob.pe",
            "Like",
            "Comment",
            "Share",
        ]
        text = MODULE.PlaywrightFacebookSourceAdapter._text_from_lines(lines, 0, "Municipalidad Distrital de Marcavelica")
        self.assertEqual(text, "")

    def test_feed_text_keeps_caption_before_page_chrome(self):
        lines = [
            "1h",
            "Texto visible de la publicación pública.",
            "Log In Forgot Account",
            "Like",
            "Comment",
            "Share",
        ]
        text = MODULE.PlaywrightFacebookSourceAdapter._text_from_lines(lines, 0, "El Chilalo Noticias")
        self.assertEqual(text, "Texto visible de la publicación pública.")

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

    def test_short_repeated_caption_is_deduplicated_when_date_is_visible(self):
        first = {"text": "CAFÉ DE ACHICORIA El café de a", "published_at": "2m", "post_url": "https://www.facebook.com/a/posts/1"}
        second = {"text": "CAFÉ DE ACHICORIA El café de a", "published_at": "3m", "post_url": "https://www.facebook.com/a/posts/2"}
        self.assertTrue(MODULE._same_visible_post(first, second))

    def test_very_short_caption_is_not_deduplicated_by_text_only(self):
        first = {"text": "Aviso local", "published_at": "2m"}
        second = {"text": "Aviso local", "published_at": "3m"}
        self.assertFalse(MODULE._same_visible_post(first, second))

    def test_video_caption_must_match_descriptive_public_url(self):
        unrelated = "[AVISO] Se vienen los talleres productivos para las mujeres."
        whale_url = "https://www.facebook.com/ElChilaloNoticias/videos/pescador-se-lanza-al-mar-para-salvar-a-una-ballena/1393457035560823"
        matching = "Pescador se lanza al mar para salvar a una ballena."
        self.assertFalse(MODULE.PlaywrightFacebookSourceAdapter._video_caption_matches_url(whale_url, unrelated))
        self.assertTrue(MODULE.PlaywrightFacebookSourceAdapter._video_caption_matches_url(whale_url, matching))


if __name__ == "__main__":
    unittest.main()
