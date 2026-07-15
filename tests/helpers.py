def random_board(rng, rows, cols, colors=3):
    """Rectangular board; 0 = empty, 1..colors = gem colors."""
    return [[rng.randint(0, colors) for _ in range(cols)] for _ in range(rows)]
