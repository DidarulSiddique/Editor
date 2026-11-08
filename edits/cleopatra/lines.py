"""The narration, one caption chunk per entry (shared by build_voice.py and subs.py).
v3 hook: "wasn't Egyptian. At least, not the way you think." — born in Egypt and ruler of Egypt, but the royal line
was Macedonian Greek (her mother is uncertain, so never "no Egyptian blood")."""
LINES = ["Egypt's most famous pharaoh… wasn't Egyptian. At least, not the way you think.", "Picture her.", "Golden collar.", "Cobra crown.",
 "All of Egypt bowing.", "Now rewind almost three hundred years.", "Macedonia, north of Greece.", "A general named Ptolemy rides beside Alexander the Great.",
 "Alexander dies young, and his empire gets carved up like a cake.", "Ptolemy grabs the richest slice.", "Egypt.",
 "His family rules it for nearly three centuries, from Alexandria, speaking Greek.", "Then Cleopatra the Seventh", "is born.",
 "And she does something no Ptolemy before her is known to have done.", "She learns Egyptian.", "She dresses as a pharaoh.",
 "She's hailed as the new Isis.", "She speaks to her people in their own language.", "Born in Egypt?", "Yes!", "Ruler of Egypt?", "Absolutely!",
 "But her royal bloodline?", "Macedonian Greek.", "She embraced Egypt", "so completely… history made her its most iconic pharaoh.",
 "So which one was the real Cleopatra?"]
JOIN = {12, 25}   # line k is spoken together with line k+1 (one sentence; split at its pause)
# delivery (v3, "the speaking is a little flat"): per-line speed multipliers and extra pause before a line (s)
SPEED = {0: 0.95, 2: 1.06, 3: 1.06, 7: 1.04, 8: 1.06, 9: 1.04, 10: 0.92, 14: 1.03, 19: 1.04, 21: 1.04, 23: 0.97, 24: 0.88, 27: 0.92}
PAUSE = {1: 0.12, 10: 0.1, 12: 0.12, 19: 0.08, 24: 0.32, 27: 0.3}
# TTS-only spellings (captions keep LINES): am_michael's American t is swallowed before a vowel, so "wasn't Egyptian" was heard as
# "was an Egyptian" under the music; "wasn't..." makes it release the t without adding a pause (ASR-checked in the mix).
SAY = {0: "Egypt's most famous pharaoh… wasn't… Egyptian. At least, not the way you think."}
