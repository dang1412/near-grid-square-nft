use near_sdk::env;
use near_contract_standards::non_fungible_token::TokenId;
use std::cmp::{max};

pub const _WORLD_SIZE: u128 = 100;

fn coord_degree(x: i128) -> i128 {
    let deg = if x >= 0 { x } else { - x - 1 };
    deg
}

pub fn get_coord(token: TokenId) -> (i128, i128) {
    let token_num = match i128::from_str_radix(&token, 10) {
        Ok(num) => num,
        Err(_) => 0
    };
    let deg = ((token_num as f64).sqrt() / 2.0) as i128;

    let (edge, left) = {
        let edge_len = deg * 2 + 1;
        let count = token_num - i128::pow(deg * 2, 2);
        let edge = (count / edge_len) as i128;  // 0 1 2 3
        let left = count % edge_len;

        (edge, left)
    };

    match edge {
        // left edge
        0 => (- deg - 1, deg - 1 - left),
        // top edge
        1 => (- deg + left, - deg - 1),
        // right edge
        2 => (deg, - deg + left),
        // bottom edge
        3 => (deg - 1 - left, deg),
        // default (not run into)
        _ => (0, 0),
    }
}

pub fn get_token_id(x: i128, y: i128) -> TokenId {
    let deg = max(coord_degree(x), coord_degree(y));
    let edge_len = deg * 2 + 1;

    let min_coord = - deg - 1;
    let max_coord = deg;

    let mut index = i128::pow(deg * 2, 2);
    if x == min_coord && y < max_coord {
        index += (max_coord - 1) - y;
    } else if y == min_coord {
        index += edge_len + x - (min_coord + 1);
    } else if x == max_coord {
        index += edge_len * 2 + y - (min_coord + 1);
    } else {
        index += edge_len * 3 + (max_coord - 1) - x;
    }

    index.to_string()
}

pub fn expect_token_found<T>(option: Option<T>) -> T {
    option.unwrap_or_else(|| env::panic_str("Token not found"))
}

pub fn iterate_token_area<F: FnMut(TokenId) -> bool>(token_id: TokenId, width: u8, height: u8, mut func: F) {
    let (start_x, start_y) = get_coord(token_id.clone());

    for i in 0..(width as i128) {
        let mut is_continue = true;
        for j in 0..(height as i128) {
            let x = start_x + i;
            let y = start_y + j;
            let sub_token_id = get_token_id(x, y);
            is_continue = func(sub_token_id);
            if is_continue == false {
                break;
            }
        }
        if is_continue == false {
            break;
        }
    }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use super::*;

    // will have corresponding token ids: [0, 1, 2, 3, 4, 5,...]
    const COORD_ARRAY: &[(i128, i128)] = &[(-1, -1), (0, -1), (0, 0), (-1, 0), (-2, 0), (-2, -1)];

    #[test]
    fn test_get_coord() {
        for i in 0..COORD_ARRAY.len() {
            let coord = get_coord(i.to_string());
            assert_eq!(coord, COORD_ARRAY[i]);
        }
    }

    #[test]
    fn test_get_token_id() {
        for i in 0..COORD_ARRAY.len() {
            let (x, y) = COORD_ARRAY[i];
            let token_id = get_token_id(x, y);
            assert_eq!(token_id, i.to_string());
        }
    }

    #[test]
    fn test_iterate_token_area() {
        let mut token_ids_vec: Vec<TokenId> = Vec::new();
        iterate_token_area("7".to_string(), 2, 3, |token_id| {
            token_ids_vec.push(token_id);
            true
        });

        // expected
        let rs = vec!["7", "0", "3", "8", "1", "2"];

        // method 1
        for i in 0..6 {
            assert_eq!(token_ids_vec[i], rs[i].to_string());
        }

        // method 2
        let token_ids: Vec<&str> = token_ids_vec.iter().map(|token_id| token_id.as_str()).collect();
        assert_eq!(token_ids, rs);
    }
}
