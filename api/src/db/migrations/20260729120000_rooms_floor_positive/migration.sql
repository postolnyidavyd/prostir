ALTER TABLE "rooms"
    ADD CONSTRAINT "rooms_floor_positive" CHECK ("floor" > 0);
