<?php
// VIBRA - Get Blocked Users API
// File: /api/get_blocked.php

require_once 'config.php';

// Return empty array since blocking is handled client-side
sendSuccess(['blocked' => []]);